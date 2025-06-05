import { OPENROUTER_CONFIG } from '../config/openrouter';

// 1. Define Output Interfaces
export interface ExtractedSessionDetails {
  location: string;
  date_hint: string; // e.g., "today", "yesterday", "last Tuesday"
  session_notes?: string;
}

export interface ExtractedClimb {
  name?: string; // default to "Unknown Climb"
  grade: string;
  tick_type: 'send' | 'attempt' | 'flash' | 'onsight' | 'unknown';
  attempts?: number; // default 1
  climb_notes?: string;
  skills?: string[];
}

export interface VoiceLogExtractionResult {
  session_details: ExtractedSessionDetails;
  climbs: ExtractedClimb[];
}

// 2. Design Prompts

const SYSTEM_PROMPT = `You are a helpful AI assistant specialized in processing climbing log transcripts.
Your task is to extract session details and a list of climbs from the provided transcript.
You must output the extracted information exclusively in JSON format, adhering to the specified structure.
Do not include any explanatory text or markdown formatting around the JSON output.
The JSON output should look like this:
{
  "session_details": {
    "location": "string",
    "date_hint": "string (e.g., 'today', 'yesterday', 'last Tuesday')",
    "session_notes": "string (optional)"
  },
  "climbs": [
    {
      "name": "string (optional, default to 'Unknown Climb')",
      "grade": "string",
      "tick_type": "'send' | 'attempt' | 'flash' | 'onsight' | 'unknown'",
      "attempts": "number (optional, default 1)",
      "climb_notes": "string (optional)",
      "skills": ["string array (optional)"]
    }
  ]
}
Ensure all fields are present as specified. For optional fields, omit them if no information is found.
For 'tick_type', choose only from the provided options. If unsure, use 'unknown'.
If a climb name is not mentioned, use "Unknown Climb".
If the number of attempts is not mentioned, default to 1.
`;

function createUserPrompt(transcript: string): string {
  return `Please process the following climbing log transcript and extract the session details and climbs according to the JSON structure I provided in the system instructions.

Transcript:
---
${transcript}
---

Remember to only output the JSON object.
Example of the desired JSON output format:
{
  "session_details": {
    "location": "Hueco Tanks",
    "date_hint": "yesterday",
    "session_notes": "Felt pretty strong, good conditions."
  },
  "climbs": [
    {
      "name": "Moonshine Roof",
      "grade": "V4",
      "tick_type": "send",
      "attempts": 2,
      "climb_notes": "Finally got the crux move.",
      "skills": ["slopers", "mantle"]
    },
    {
      "name": "Unknown Climb",
      "grade": "V2",
      "tick_type": "attempt",
      "climb_notes": "Fell at the top."
    },
    {
      "grade": "V5",
      "tick_type": "flash"
    }
  ]
}
`;
}

// 3. Implement VoiceLogExtractionService Class
export class VoiceLogExtractionService {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || OPENROUTER_CONFIG.defaultApiKey;
    this.model = model || OPENROUTER_CONFIG.defaultModel;
    this.baseURL = OPENROUTER_CONFIG.baseURL;

    if (!this.apiKey) {
        throw new Error("API key for OpenRouter is not provided or configured.");
    }
  }

  private parseAndValidateExtraction(jsonString: string): VoiceLogExtractionResult {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Failed to parse JSON response from AI: ${(error as Error).message}`);
    }

    // Assert to a loose structure for validation steps
    const parsed = parsedJson as Partial<VoiceLogExtractionResult & { session_details: Partial<ExtractedSessionDetails>, climbs: unknown[] }>;

    // Basic structural validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure: Response is not an object.');
    }

    if (!parsed.session_details || typeof parsed.session_details !== 'object') {
      throw new Error('Invalid JSON structure: session_details is missing or not an object.');
    }
    if (typeof parsed.session_details.location !== 'string' || !parsed.session_details.location) {
        throw new Error('Invalid JSON structure: session_details.location is missing or not a string.');
    }
    if (typeof parsed.session_details.date_hint !== 'string' || !parsed.session_details.date_hint) {
        throw new Error('Invalid JSON structure: session_details.date_hint is missing or not a string.');
    }


    if (!Array.isArray(parsed.climbs)) {
      throw new Error('Invalid JSON structure: climbs is missing or not an array.');
    }

    // Validate each climb object
    (parsed.climbs as unknown[]).forEach((climbUntyped: unknown, index: number) => {
      const climb = climbUntyped as Partial<ExtractedClimb>;
      if (typeof climb !== 'object' || climb === null) {
        throw new Error(`Invalid JSON structure: climb at index ${index} is not an object.`);
      }
      if (typeof climb.grade !== 'string' || !climb.grade) {
        throw new Error(`Invalid JSON structure: climb at index ${index} is missing grade or grade is not a string.`);
      }
      const validTickTypes = ['send', 'attempt', 'flash', 'onsight', 'unknown'];
      if (typeof climb.tick_type !== 'string' || !validTickTypes.includes(climb.tick_type)) {
        throw new Error(`Invalid JSON structure: climb at index ${index} has invalid or missing tick_type.`);
      }
      if (climb.name !== undefined && typeof climb.name !== 'string') {
        throw new Error(`Invalid JSON structure: climb at index ${index} has a name that is not a string.`);
      }
       if (climb.attempts !== undefined && typeof climb.attempts !== 'number') {
        throw new Error(`Invalid JSON structure: climb at index ${index} has attempts that is not a number.`);
      }
      // Optional fields like climb_notes and skills can be validated further if needed
    });

    // Apply defaults for optional fields if not present and ensure ExtractedClimb structure
    parsed.climbs = (parsed.climbs as unknown[]).map((climbUntyped: unknown): ExtractedClimb => {
        const climb = climbUntyped as Partial<ExtractedClimb>;
        return {
            name: climb.name || "Unknown Climb",
            grade: climb.grade!,
            tick_type: climb.tick_type!,
            attempts: climb.attempts === undefined ? 1 : climb.attempts,
            climb_notes: climb.climb_notes,
            skills: climb.skills,
        };
    });

    return parsed as VoiceLogExtractionResult;
  }

  async extractDataFromTranscript(transcript: string): Promise<VoiceLogExtractionResult> {
    const userPrompt = createUserPrompt(transcript);
    const systemPrompt = SYSTEM_PROMPT;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Climbing Log Processor', // Optional: For OpenRouter analytics
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2, // Lower temperature for more deterministic JSON output
          max_tokens: 1500, // Adjust as needed
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response structure from OpenRouter API: No message content found.');
      }

      const jsonString = data.choices[0].message.content.trim();

      // Sometimes the AI might still wrap the JSON in markdown, try to remove it
      const cleanedJsonString = jsonString.replace(/^```json\s*|\s*```$/g, '');

      return this.parseAndValidateExtraction(cleanedJsonString);

    } catch (error) {
      console.error("Error in extractDataFromTranscript:", error);
      // Re-throw or handle as appropriate for your application
      if (error instanceof Error) {
          throw new Error(`Failed to extract data from transcript: ${error.message}`);
      }
      throw new Error('An unknown error occurred while extracting data from transcript.');
    }
  }
}

// Example Usage (for testing purposes, remove or comment out in production)
/*
async function testExtraction() {
  const MOCK_TRANSCRIPT = "Session at The Boulders yesterday. Sent 'The Fin' V5, took 3 tries. Also worked on 'Slab Master' V3, couldn't send it. Oh and flashed 'Easy Peasy' V1.";

  // Make sure OPENROUTER_CONFIG.defaultApiKey is set or provide one here
  // For local testing, you might need to set the API key directly if not available in environment
  const apiKey = OPENROUTER_CONFIG.defaultApiKey || "YOUR_OPENROUTER_API_KEY";
  if (apiKey === "YOUR_OPENROUTER_API_KEY" || !apiKey) {
      console.warn("Using placeholder API key for testing. Real calls will fail unless a valid key is provided in openrouter.ts or directly.");
  }

  const extractionService = new VoiceLogExtractionService(apiKey);

  try {
    console.log("Sending transcript to AI for extraction...");
    const result = await extractionService.extractDataFromTranscript(MOCK_TRANSCRIPT);
    console.log("Extraction successful:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Extraction failed:", error);
  }
}

// To run the test:
// 1. Ensure you have Node.js and ts-node installed.
// 2. Save this file as VoiceLogExtractionService.ts
// 3. If OPENROUTER_CONFIG.defaultApiKey is not set, replace "YOUR_OPENROUTER_API_KEY" with a real key.
// 4. Run from your terminal in the src/services directory: `npx ts-node VoiceLogExtractionService.ts`
// Note: Running this directly will make an API call.
// testExtraction();
*/

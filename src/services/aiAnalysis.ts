import { OPENROUTER_CONFIG } from '@/config/openrouter';
import { Session } from '@/types/climbing';

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  progressInsights: string;
}

export class AIAnalysisService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = OPENROUTER_CONFIG.defaultModel) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeSession(session: Session): Promise<AnalysisResult> {
    const prompt = this.generateAnalysisPrompt(session);

    const response = await fetch(OPENROUTER_CONFIG.baseURL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ClimbLog Performance Analysis'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional climbing coach and performance analyst. Analyze the climbing session data and provide specific, actionable feedback. Format your response with clear sections: SUMMARY, STRENGTHS, AREAS FOR IMPROVEMENT, RECOMMENDATIONS, and PROGRESS INSIGHTS. Use bullet points for lists.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    // Define a more specific type for the expected response structure
    interface OpenRouterChoice {
      message?: { content?: string };
    }
    interface OpenRouterResponse {
      choices?: OpenRouterChoice[];
      // other properties from OpenRouter API could be added here if needed
    }

    const data: OpenRouterResponse = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis received from AI');
    }

    return this.parseAnalysis(analysisText);
  }

  private generateAnalysisPrompt(session: Session): string {
    const duration = session.endTime ? 
      Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60) : 0;

    const sends = session.climbs.filter(c => c.tickType === 'send').length;
    const attempts = session.climbs.filter(c => c.tickType === 'attempt').length;
    const flashes = session.climbs.filter(c => c.tickType === 'flash').length;
    const onsights = session.climbs.filter(c => c.tickType === 'onsight').length;

    const grades = session.climbs.map(c => c.grade);
    const efforts = session.climbs.map(c => c.effort).filter(e => e !== undefined) as number[];
    const avgEffort = efforts.length > 0 ? efforts.reduce((a, b) => a + b, 0) / efforts.length : 0;

    return `Analyze this climbing session and provide specific feedback based on the actual performance data.

SESSION DATA:
- Location: ${session.location}
- Type: ${session.climbingType}
- Duration: ${duration} minutes
- Total climbs: ${session.climbs.length}
- Sends: ${sends}
- Failed attempts: ${attempts}
- Flashes: ${flashes}
- Onsights: ${onsights}
- Average effort: ${avgEffort.toFixed(1)}/10
- Grades: ${grades.join(', ')}

CLIMBS DETAILS:
${session.climbs.map(climb => 
  `- ${climb.name} (${climb.grade}): ${climb.tickType}${climb.effort ? `, effort ${climb.effort}/10` : ''}${climb.notes ? `, notes: ${climb.notes}` : ''}`
).join('\n')}

Please provide analysis in exactly this format:

**SUMMARY:**
[2-3 sentences about overall session performance]

**STRENGTHS:**
- [specific strength based on this session]
- [another strength based on performance data]
- [third strength if applicable]

**AREAS FOR IMPROVEMENT:**
- [specific area to work on based on session data]
- [another improvement area if needed]

**RECOMMENDATIONS:**
- [actionable training suggestion based on performance]
- [specific technique or conditioning recommendation]
- [third recommendation if applicable]

**PROGRESS INSIGHTS:**
[1-2 sentences about patterns and progress indicators from this session]`;
  }

  private parseAnalysis(analysisText: string): AnalysisResult {
    console.log('Raw analysis text:', analysisText);
    
    // More flexible parsing with multiple fallback patterns
    const sections = {
      summary: this.extractSection(analysisText, ['SUMMARY', 'Session Summary', 'Overview']),
      strengths: this.extractListSection(analysisText, ['STRENGTHS', 'Strengths', 'What went well']),
      areasForImprovement: this.extractListSection(analysisText, ['AREAS FOR IMPROVEMENT', 'Areas for Improvement', 'Improvement Areas', 'Areas to improve']),
      recommendations: this.extractListSection(analysisText, ['RECOMMENDATIONS', 'Recommendations', 'Suggestions']),
      progressInsights: this.extractSection(analysisText, ['PROGRESS INSIGHTS', 'Progress Insights', 'Progress', 'Insights'])
    };

    const result = {
      summary: sections.summary || 'Session completed with good overall performance.',
      strengths: sections.strengths,
      areasForImprovement: sections.areasForImprovement,
      recommendations: sections.recommendations,
      progressInsights: sections.progressInsights || 'Continue building on current performance and addressing areas for growth.'
    };

    console.log('Parsed analysis result:', result);
    return result;
  }

  private extractSection(text: string, sectionNames: string[]): string {
    for (const sectionName of sectionNames) {
      // Try with ** formatting
      const pattern1 = new RegExp(`\\*\\*${sectionName}:\\*\\*\\s*([^*]+?)(?=\\*\\*|$)`, 'is');
      // Try without ** formatting
      const pattern2 = new RegExp(`${sectionName}:\\s*([^\\n]+?)(?=\\n[A-Z]|$)`, 'is');
      // Try with just section name
      const pattern3 = new RegExp(`${sectionName}\\s*([^\\n]+?)(?=\\n[A-Z]|$)`, 'is');
      
      const match = text.match(pattern1) || text.match(pattern2) || text.match(pattern3);
      if (match && match[1]) {
        return match[1].trim().replace(/^\*\*|\*\*$/g, '');
      }
    }
    return '';
  }

  private extractListSection(text: string, sectionNames: string[]): string[] {
    for (const sectionName of sectionNames) {
      // Try with ** formatting
      const pattern1 = new RegExp(`\\*\\*${sectionName}:\\*\\*\\s*(.*?)(?=\\*\\*[A-Z]|$)`, 'is');
      // Try without ** formatting
      const pattern2 = new RegExp(`${sectionName}:\\s*(.*?)(?=\\n[A-Z][A-Z]|$)`, 'is');
      
      const match = text.match(pattern1) || text.match(pattern2);
      if (match && match[1]) {
        const listText = match[1].trim();
        const items = listText.split(/\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Remove bullet points and clean up
            return line.replace(/^[-*•]\s*/, '').replace(/^\[|\]$/g, '').trim();
          })
          .filter(line => {
            // Keep lines that have actual content and aren't just placeholders
            return line.length > 10 && 
                   !line.toLowerCase().includes('specific') && 
                   !line.includes('[') && 
                   !line.includes(']') &&
                   !line.toLowerCase().includes('placeholder');
          });
        
        return items.slice(0, 3); // Limit to 3 items max
      }
    }
    return [];
  }
}

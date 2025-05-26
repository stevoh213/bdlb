
import { Session } from '@/types/climbing';
import { OPENROUTER_CONFIG } from '@/config/openrouter';

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
            content: 'You are a professional climbing coach and performance analyst. Provide constructive, specific feedback based on climbing session data. Be encouraging but honest about areas for improvement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

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
    const efforts = session.climbs.map(c => c.effort);
    const avgEffort = efforts.length > 0 ? efforts.reduce((a, b) => a + b, 0) / efforts.length : 0;

    return `Analyze this climbing session and provide structured feedback:

SESSION DETAILS:
- Location: ${session.location}
- Type: ${session.climbingType}
- Duration: ${duration} minutes
- Total climbs: ${session.climbs.length}

PERFORMANCE BREAKDOWN:
- Sends: ${sends}
- Attempts (didn't complete): ${attempts}
- Flashes: ${flashes}
- Onsights: ${onsights}
- Average effort level: ${avgEffort.toFixed(1)}/10
- Grades attempted: ${grades.join(', ')}

CLIMB DETAILS:
${session.climbs.map(climb => 
  `- ${climb.name} (${climb.grade}): ${climb.tickType}, effort ${climb.effort}/10${climb.notes ? `, notes: ${climb.notes}` : ''}`
).join('\n')}

Please provide analysis in this exact format:

SUMMARY:
[2-3 sentence overview of the session]

STRENGTHS:
- [specific strength 1]
- [specific strength 2]
- [specific strength 3]

AREAS FOR IMPROVEMENT:
- [specific area 1]
- [specific area 2]

RECOMMENDATIONS:
- [actionable recommendation 1]
- [actionable recommendation 2]
- [actionable recommendation 3]

PROGRESS INSIGHTS:
[1-2 sentences about patterns and progress indicators]`;
  }

  private parseAnalysis(analysisText: string): AnalysisResult {
    const sections = analysisText.split(/(?:SUMMARY:|STRENGTHS:|AREAS FOR IMPROVEMENT:|RECOMMENDATIONS:|PROGRESS INSIGHTS:)/);
    
    const summary = sections[1]?.trim() || 'Analysis completed successfully.';
    const strengthsText = sections[2]?.trim() || '';
    const areasText = sections[3]?.trim() || '';
    const recommendationsText = sections[4]?.trim() || '';
    const progressInsights = sections[5]?.trim() || 'Keep up the great work!';

    const parseList = (text: string): string[] => {
      return text.split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    };

    return {
      summary,
      strengths: parseList(strengthsText),
      areasForImprovement: parseList(areasText),
      recommendations: parseList(recommendationsText),
      progressInsights
    };
  }
}

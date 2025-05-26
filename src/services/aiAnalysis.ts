
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
            content: 'You are a professional climbing coach and performance analyst. Analyze the climbing session data and provide specific, actionable feedback. Do not use placeholder text or template formats - provide real, detailed analysis based on the actual performance data.'
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
    const efforts = session.climbs.map(c => c.effort).filter(e => e !== undefined) as number[];
    const avgEffort = efforts.length > 0 ? efforts.reduce((a, b) => a + b, 0) / efforts.length : 0;

    return `Analyze this climbing session data and provide specific, actionable feedback. Replace all placeholder text with actual analysis:

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

INDIVIDUAL CLIMBS:
${session.climbs.map(climb => 
  `- ${climb.name} (${climb.grade}): ${climb.tickType}${climb.effort ? `, effort ${climb.effort}/10` : ''}${climb.notes ? `, notes: ${climb.notes}` : ''}`
).join('\n')}

Provide analysis in this format, but replace ALL content with specific observations about THIS session:

**SUMMARY:**
Write 2-3 sentences about the overall session performance

**STRENGTHS:**
- List 2-3 specific things done well this session
- Be specific about techniques, grades, or performance patterns

**AREAS FOR IMPROVEMENT:**
- List 1-2 specific areas to focus on
- Base on actual performance data from this session

**RECOMMENDATIONS:**
- Provide 2-3 actionable training suggestions
- Make them specific to the climber's current level and performance

**PROGRESS INSIGHTS:**
Write 1-2 sentences about patterns and what this session indicates about progress`;
  }

  private parseAnalysis(analysisText: string): AnalysisResult {
    console.log('Raw analysis text:', analysisText);
    
    // More robust parsing that handles various formats
    const summaryMatch = analysisText.match(/\*\*SUMMARY:\*\*\s*(.*?)(?=\*\*|$)/s) || 
                        analysisText.match(/SUMMARY:\s*(.*?)(?=STRENGTHS:|AREAS FOR|RECOMMENDATIONS:|PROGRESS INSIGHTS:|$)/s);
    
    const strengthsMatch = analysisText.match(/\*\*STRENGTHS:\*\*\s*(.*?)(?=\*\*|$)/s) || 
                          analysisText.match(/STRENGTHS:\s*(.*?)(?=AREAS FOR|RECOMMENDATIONS:|PROGRESS INSIGHTS:|$)/s);
    
    const areasMatch = analysisText.match(/\*\*AREAS FOR IMPROVEMENT:\*\*\s*(.*?)(?=\*\*|$)/s) || 
                      analysisText.match(/AREAS FOR IMPROVEMENT:\s*(.*?)(?=RECOMMENDATIONS:|PROGRESS INSIGHTS:|$)/s);
    
    const recommendationsMatch = analysisText.match(/\*\*RECOMMENDATIONS:\*\*\s*(.*?)(?=\*\*|$)/s) || 
                                analysisText.match(/RECOMMENDATIONS:\s*(.*?)(?=PROGRESS INSIGHTS:|$)/s);
    
    const progressMatch = analysisText.match(/\*\*PROGRESS INSIGHTS:\*\*\s*(.*?)$/s) || 
                         analysisText.match(/PROGRESS INSIGHTS:\s*(.*?)$/s);

    const summary = summaryMatch?.[1]?.trim() || 'Session completed successfully with solid performance across different climbs.';
    const strengthsText = strengthsMatch?.[1]?.trim() || '';
    const areasText = areasMatch?.[1]?.trim() || '';
    const recommendationsText = recommendationsMatch?.[1]?.trim() || '';
    const progressInsights = progressMatch?.[1]?.trim() || 'Continue building on current strengths while addressing areas for improvement.';

    const parseList = (text: string): string[] => {
      if (!text) return [];
      
      return text.split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line.length > 0 && !line.includes('[') && !line.includes('specific'))
        .slice(0, 3); // Limit to 3 items
    };

    const result = {
      summary: summary.replace(/^\*\*|\*\*$/g, '').trim(),
      strengths: parseList(strengthsText),
      areasForImprovement: parseList(areasText),
      recommendations: parseList(recommendationsText),
      progressInsights: progressInsights.replace(/^\*\*|\*\*$/g, '').trim()
    };

    console.log('Parsed analysis result:', result);
    return result;
  }
}

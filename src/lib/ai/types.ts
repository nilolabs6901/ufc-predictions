/**
 * Shared types for multi-model AI analysis system
 */

export interface ModelAnalysisResult {
  provider: string;
  modelId: string;
  matchupSummary: string;
  pickExplanation: string;
  keyFactorNarrative?: string;
  recommendedPick: 'fighterA' | 'fighterB';
  recommendedFighter: string;
  winProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  bettingInsight?: string;
  cautionFlags: string[];
  tokensUsed: number;
  latencyMs: number;
  error?: string;
}

export interface AIAnalysisProvider {
  provider: string;
  modelId: string;
  isAvailable(): boolean;
  analyze(prompt: string, fighterAName: string, fighterBName: string, isPickA: boolean, winProb: number): Promise<ModelAnalysisResult>;
}

export interface ConsensusResult {
  consensusType: 'unanimous' | 'majority' | 'split';
  modelsAgree: number;
  modelsTotal: number;
  avgWinProbability: number;
  consensusPick?: 'fighterA' | 'fighterB';
  consensusFighter?: string;
  modelBreakdown: {
    provider: string;
    modelId: string;
    pick: 'fighterA' | 'fighterB';
    fighter: string;
    confidenceLevel: string;
    winProbability: number;
    error?: string;
  }[];
}

export interface MultiModelResult {
  analyses: ModelAnalysisResult[];
  consensus: ConsensusResult;
  primaryAnalysis: ModelAnalysisResult; // Best successful analysis for display
}

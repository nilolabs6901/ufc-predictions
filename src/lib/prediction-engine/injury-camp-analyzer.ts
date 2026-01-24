// Injury & Camp Intelligence Analyzer
// Calculates prediction adjustments based on injury history and camp reports

import {
  INJURY_SEVERITY_IMPACT,
  INJURY_TYPE_MULTIPLIERS,
  CAMP_IMPACT
} from './config';

export interface InjuryData {
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'major' | 'career_threatening';
  occurredDate?: Date;
  isRecovered: boolean;
  affectsFight: boolean;
}

export interface CampData {
  campWeeks?: number;
  isShortNotice: boolean;
  campChanged: boolean;
  weightIssues: boolean;
  personalIssues: boolean;
  lowConfidence: boolean;
  highConfidence: boolean;
  sparringQuality?: 'elite' | 'good' | 'average' | 'poor';
  specificPrep: boolean;
}

export interface InjuryCampAnalysis {
  injuryAdjustment: number;
  campAdjustment: number;
  totalAdjustment: number;
  concerns: string[];
  positives: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * Analyze injury impact on fighter performance
 */
export function analyzeInjuryImpact(
  injuries: InjuryData[],
  fighterStyle: string
): { adjustment: number; concerns: string[] } {
  let totalAdjustment = 0;
  const concerns: string[] = [];

  // Filter to only active (not recovered) injuries that affect fight
  const activeInjuries = injuries.filter(i => !i.isRecovered && i.affectsFight);

  for (const injury of activeInjuries) {
    // Base severity impact
    const severityImpact = INJURY_SEVERITY_IMPACT[injury.severity] || 0;

    // Style-specific multiplier
    const styleMultipliers = INJURY_TYPE_MULTIPLIERS[injury.bodyPart.toLowerCase()] || {};
    const styleMultiplier = styleMultipliers[fighterStyle] || 1.0;

    const injuryImpact = severityImpact * styleMultiplier;
    totalAdjustment += injuryImpact;

    // Generate concern message
    const severityText = injury.severity.replace('_', ' ');
    const impactPercent = Math.abs(injuryImpact * 100).toFixed(1);
    concerns.push(
      `${severityText} ${injury.bodyPart} injury (-${impactPercent}% impact)`
    );
  }

  // Recent injury history (even if recovered) can indicate vulnerability
  const recentRecovered = injuries.filter(i => {
    if (!i.occurredDate || !i.isRecovered) return false;
    const monthsAgo = (Date.now() - i.occurredDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo < 6; // Within 6 months
  });

  if (recentRecovered.length > 0) {
    totalAdjustment -= 0.01 * recentRecovered.length;
    concerns.push(
      `Recently recovered from ${recentRecovered.length} injury(ies) - potential re-injury risk`
    );
  }

  return { adjustment: totalAdjustment, concerns };
}

/**
 * Analyze training camp quality and preparation
 */
export function analyzeCampImpact(
  campData: CampData
): { adjustment: number; concerns: string[]; positives: string[] } {
  let totalAdjustment = 0;
  const concerns: string[] = [];
  const positives: string[] = [];

  // Short notice fight
  if (campData.isShortNotice) {
    totalAdjustment += CAMP_IMPACT.SHORT_NOTICE;
    concerns.push('Short notice fight (<4 weeks preparation)');
  } else if (campData.campWeeks !== undefined) {
    if (campData.campWeeks < 6) {
      totalAdjustment += CAMP_IMPACT.SHORT_CAMP;
      concerns.push(`Abbreviated camp (${campData.campWeeks} weeks)`);
    } else if (campData.campWeeks >= 8 && campData.campWeeks <= 12) {
      totalAdjustment += CAMP_IMPACT.NORMAL_CAMP;
      positives.push('Full training camp completed');
    } else if (campData.campWeeks > 12) {
      totalAdjustment += CAMP_IMPACT.LONG_CAMP;
      positives.push('Extended preparation time');
    }
  }

  // Camp change
  if (campData.campChanged) {
    totalAdjustment += CAMP_IMPACT.CAMP_CHANGE;
    concerns.push('Recently changed training camps');
  }

  // Weight issues
  if (campData.weightIssues) {
    totalAdjustment += CAMP_IMPACT.WEIGHT_ISSUES;
    concerns.push('Reported weight cut difficulties');
  }

  // Personal issues
  if (campData.personalIssues) {
    totalAdjustment += CAMP_IMPACT.PERSONAL_ISSUES;
    concerns.push('Personal/external issues reported');
  }

  // Confidence
  if (campData.lowConfidence) {
    totalAdjustment += CAMP_IMPACT.LOW_CONFIDENCE;
    concerns.push('Low confidence reported in interviews');
  }
  if (campData.highConfidence) {
    totalAdjustment += CAMP_IMPACT.HIGH_CONFIDENCE;
    positives.push('High confidence going into fight');
  }

  // Sparring quality
  if (campData.sparringQuality) {
    switch (campData.sparringQuality) {
      case 'elite':
        totalAdjustment += 0.02;
        positives.push('Elite sparring partners');
        break;
      case 'good':
        totalAdjustment += 0.01;
        positives.push('Quality sparring available');
        break;
      case 'poor':
        totalAdjustment -= 0.02;
        concerns.push('Limited sparring partners');
        break;
    }
  }

  // Specific preparation
  if (campData.specificPrep) {
    totalAdjustment += 0.015;
    positives.push('Brought in opponent-specific sparring partners');
  }

  return { adjustment: totalAdjustment, concerns, positives };
}

/**
 * Combined analysis of injury and camp factors
 */
export function analyzeInjuryAndCamp(
  injuries: InjuryData[],
  campData: CampData | null,
  fighterStyle: string
): InjuryCampAnalysis {
  // Injury analysis
  const injuryAnalysis = analyzeInjuryImpact(injuries, fighterStyle);

  // Camp analysis
  const campAnalysis = campData
    ? analyzeCampImpact(campData)
    : { adjustment: 0, concerns: [], positives: [] };

  const totalAdjustment = injuryAnalysis.adjustment + campAnalysis.adjustment;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  const concernCount = injuryAnalysis.concerns.length + campAnalysis.concerns.length;

  if (totalAdjustment < -0.15 || concernCount >= 4) {
    riskLevel = 'extreme';
  } else if (totalAdjustment < -0.10 || concernCount >= 3) {
    riskLevel = 'high';
  } else if (totalAdjustment < -0.05 || concernCount >= 2) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return {
    injuryAdjustment: injuryAnalysis.adjustment,
    campAdjustment: campAnalysis.adjustment,
    totalAdjustment,
    concerns: [...injuryAnalysis.concerns, ...campAnalysis.concerns],
    positives: campAnalysis.positives,
    riskLevel,
  };
}

/**
 * Calculate comparative advantage based on injury/camp status
 */
export function calculateInjuryCampAdvantage(
  fighterAAnalysis: InjuryCampAnalysis,
  fighterBAnalysis: InjuryCampAnalysis
): {
  advantageFighter: 'A' | 'B' | 'even';
  advantageAmount: number;
  summary: string;
} {
  const diffAdjustment = fighterAAnalysis.totalAdjustment - fighterBAnalysis.totalAdjustment;

  let advantageFighter: 'A' | 'B' | 'even';
  if (Math.abs(diffAdjustment) < 0.02) {
    advantageFighter = 'even';
  } else if (diffAdjustment > 0) {
    advantageFighter = 'A';
  } else {
    advantageFighter = 'B';
  }

  // Generate summary
  let summary: string;
  if (advantageFighter === 'even') {
    summary = 'Both fighters have similar health/camp situations';
  } else {
    const winner = advantageFighter === 'A' ? 'Fighter A' : 'Fighter B';
    const loser = advantageFighter === 'A' ? 'Fighter B' : 'Fighter A';
    const loserAnalysis = advantageFighter === 'A' ? fighterBAnalysis : fighterAAnalysis;

    if (loserAnalysis.riskLevel === 'extreme' || loserAnalysis.riskLevel === 'high') {
      summary = `${winner} has significant preparation advantage - ${loser} has concerning health/camp issues`;
    } else {
      summary = `${winner} has slight preparation edge`;
    }
  }

  return {
    advantageFighter,
    advantageAmount: Math.abs(diffAdjustment),
    summary,
  };
}

/**
 * Format injury/camp analysis for prediction display
 */
export function formatAnalysisForDisplay(analysis: InjuryCampAnalysis): {
  impactText: string;
  impactColor: 'green' | 'yellow' | 'orange' | 'red';
  details: string[];
} {
  let impactText: string;
  let impactColor: 'green' | 'yellow' | 'orange' | 'red';

  if (analysis.totalAdjustment >= 0) {
    impactText = 'Optimal';
    impactColor = 'green';
  } else if (analysis.totalAdjustment >= -0.05) {
    impactText = 'Minor Concerns';
    impactColor = 'yellow';
  } else if (analysis.totalAdjustment >= -0.10) {
    impactText = 'Moderate Concerns';
    impactColor = 'orange';
  } else {
    impactText = 'Major Concerns';
    impactColor = 'red';
  }

  const details = [
    ...analysis.concerns.map(c => `- ${c}`),
    ...analysis.positives.map(p => `+ ${p}`),
  ];

  return { impactText, impactColor, details };
}

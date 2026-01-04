/**
 * Format a number as Euro currency
 */
export function formatEuro(amount: number, showSign: boolean = false): string {
  // Handle NaN, null, undefined, or invalid numbers
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  const formattedAmount = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+ ${formattedAmount}` : `- ${formattedAmount}`;
  }

  return formattedAmount;
}

/**
 * Calculate future value with compound interest
 */
export function futureValue(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  
  // Future value of present amount
  const fvPresent = presentValue * Math.pow(1 + monthlyRate, months);
  
  // Future value of monthly contributions (annuity)
  const fvAnnuity = monthlyRate > 0 
    ? monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
    : monthlyContribution * months;
  
  return fvPresent + fvAnnuity;
}

/**
 * Calculate required monthly contribution to reach a goal
 */
export function requiredMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  
  // Future value of current amount
  const futureValueCurrent = currentAmount * Math.pow(1 + monthlyRate, months);
  
  // Amount still needed
  const stillNeeded = targetAmount - futureValueCurrent;
  
  if (stillNeeded <= 0) return 0;
  
  // Required monthly contribution
  if (monthlyRate > 0) {
    return stillNeeded / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    return stillNeeded / months;
  }
}

/**
 * Calculate the time to reach a goal with given monthly contributions
 */
export function timeToGoal(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
  annualRate: number
): number {
  if (currentAmount >= targetAmount) return 0;
  if (monthlyContribution <= 0) return Infinity;
  
  const monthlyRate = annualRate / 12 / 100;
  const stillNeeded = targetAmount - currentAmount;
  
  if (monthlyRate > 0) {
    // Using logarithms to solve for time in compound interest formula
    const numerator = Math.log(1 + (stillNeeded * monthlyRate) / monthlyContribution);
    const denominator = Math.log(1 + monthlyRate);
    return Math.ceil(numerator / denominator);
  } else {
    // Simple case without interest
    return Math.ceil(stillNeeded / monthlyContribution);
  }
}

/**
 * Calculate portfolio allocation percentages
 */
export function calculateAllocation(assets: Record<string, number>): Record<string, number> {
  const total = Object.values(assets).reduce((sum, value) => sum + value, 0);
  if (total === 0) return {};
  
  const allocation: Record<string, number> = {};
  for (const [type, value] of Object.entries(assets)) {
    allocation[type] = (value / total) * 100;
  }
  
  return allocation;
}

/**
 * Calculate net worth
 */
export function calculateNetWorth(assets: number, liabilities: number): number {
  return assets - liabilities;
}

/**
 * Calculate savings rate
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const savings = income - expenses;
  return (savings / income) * 100;
}

/**
 * Risk profile scoring
 */
export interface RiskProfileAnswer {
  question: string;
  answer: number; // 1-5 scale
}

export function calculateRiskProfile(answers: RiskProfileAnswer[]): {
  score: number;
  profile: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | 'very_aggressive';
  expectedReturn: number;
} {
  const totalScore = answers.reduce((sum, answer) => sum + answer.answer, 0);
  const averageScore = totalScore / answers.length;
  
  let profile: 'conservative' | 'moderate' | 'balanced' | 'aggressive' | 'very_aggressive';
  let expectedReturn: number;
  
  if (averageScore <= 1.5) {
    profile = 'conservative';
    expectedReturn = 10.0;
  } else if (averageScore <= 2.5) {
    profile = 'moderate';
    expectedReturn = 10.0;
  } else if (averageScore <= 3.5) {
    profile = 'balanced';
    expectedReturn = 10.0;
  } else if (averageScore <= 4.5) {
    profile = 'aggressive';
    expectedReturn = 10.0;
  } else {
    profile = 'very_aggressive';
    expectedReturn = 10.0;
  }
  
  return {
    score: averageScore,
    profile,
    expectedReturn
  };
}

/**
 * Portfolio rebalancing suggestions
 */
export interface PortfolioTarget {
  type: string;
  targetPercentage: number;
}

export function getRebalancingSuggestions(
  currentAllocation: Record<string, number>,
  targetAllocation: PortfolioTarget[],
  totalValue: number,
  tolerance: number = 5
): Array<{
  type: string;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  currentPercentage: number;
  targetPercentage: number;
}> {
  const suggestions = [];
  
  for (const target of targetAllocation) {
    const currentPercentage = currentAllocation[target.type] || 0;
    const difference = target.targetPercentage - currentPercentage;
    
    if (Math.abs(difference) > tolerance) {
      const action = difference > 0 ? 'buy' : 'sell';
      const amount = Math.abs(difference / 100 * totalValue);
      
      suggestions.push({
        type: target.type,
        action,
        amount,
        currentPercentage,
        targetPercentage: target.targetPercentage
      });
    } else {
      suggestions.push({
        type: target.type,
        action: 'hold' as const,
        amount: 0,
        currentPercentage,
        targetPercentage: target.targetPercentage
      });
    }
  }
  
  return suggestions;
}

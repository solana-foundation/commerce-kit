/**
 * ⚡ Priority Fee Optimizer - Advanced Fee Management
 * 
 * Implements sophisticated priority fee optimization strategies including
 * real-time fee analysis, dynamic adjustment, and MEV protection mechanisms.
 * Ensures optimal transaction inclusion while minimizing costs.
 */

import { getSharedRpc } from '../core/rpc-manager'
import { 
  ArcError,
  ArcErrorCode,
  type ArcErrorContext 
} from '../core/error-handler'

// ===== PRIORITY FEE INTERFACES =====

export interface PriorityFeeConfig {
  strategy: 'conservative' | 'moderate' | 'aggressive' | 'ultra' | 'custom'
  baseFeeMicroLamports?: number
  maxFeeMicroLamports?: number
  targetConfirmationTime?: number // seconds
  adjustmentFactor?: number
  enableDynamicAdjustment?: boolean
  mevProtection?: boolean
}

export interface FeeAnalysis {
  currentMedianFee: number
  currentP75Fee: number
  currentP90Fee: number
  currentMaxFee: number
  recommendedFee: number
  confidence: number // 0-1
  marketCondition: 'calm' | 'busy' | 'congested' | 'extreme'
}

export interface FeeRecommendation {
  microLamports: number
  estimatedConfirmationTime: number
  confidence: number
  strategy: string
  reasoning: string
}

// ===== MEV PROTECTION =====

export interface MevProtectionConfig {
  enabled: boolean
  strategy: 'basic' | 'advanced' | 'aggressive'
  maxSlippage?: number
  frontrunProtection?: boolean
  sandwichProtection?: boolean
  privateMempool?: boolean
  jitoTips?: {
    enabled: boolean
    tipAccount?: string
    tipAmount?: number
  }
}

export interface MevAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  detectedThreats: string[]
  recommendedProtection: MevProtectionConfig
  estimatedValue: number
}

// ===== HISTORICAL DATA =====

interface HistoricalFeeData {
  timestamp: number
  fees: number[]
  blockSlot: number
  congestionLevel: number
}

// ===== PRIORITY FEE OPTIMIZER =====

/**
 * Priority Fee Optimizer
 * 
 * Advanced fee optimization system that analyzes market conditions,
 * historical data, and transaction characteristics to recommend
 * optimal priority fees for fast and cost-effective inclusion.
 */
export class PriorityFeeOptimizer {
  private rpcUrl: string
  private commitment: 'processed' | 'confirmed' | 'finalized'
  private historicalData: HistoricalFeeData[] = []
  private maxHistorySize = 100

  constructor(rpcUrl: string, commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed') {
    this.rpcUrl = rpcUrl
    this.commitment = commitment
  }

  /**
   * Get optimal priority fee recommendation
   * 
   * Analyzes current network conditions and returns the optimal
   * priority fee for the given strategy and transaction type.
   */
  async getOptimalFee(
    config: PriorityFeeConfig = { strategy: 'moderate' }
  ): Promise<FeeRecommendation> {
    try {
      console.log(`⚡ [Arc Fees] Analyzing optimal fee for ${config.strategy} strategy`)

      // Get current fee analysis
      const analysis = await this.analyzeFeeMarket()
      
      // Calculate recommendation based on strategy
      const recommendation = this.calculateFeeRecommendation(analysis, config)
      
      // Apply dynamic adjustments if enabled
      if (config.enableDynamicAdjustment) {
        return this.applyDynamicAdjustment(recommendation, analysis, config)
      }

      return recommendation

    } catch (error) {
      console.warn('[Arc Fees] Fee analysis failed, using fallback:', error)
      return this.getFallbackRecommendation(config)
    }
  }

  /**
   * Analyze current fee market conditions
   * 
   * Fetches and analyzes recent priority fees to understand
   * current market conditions and congestion levels.
   */
  async analyzeFeeMarket(): Promise<FeeAnalysis> {
    const rpc = getSharedRpc(this.rpcUrl, this.commitment)
    
    try {
      // Get recent prioritization fees
      const recentFees = await rpc.getRecentPrioritizationFees().send()
      
      if (!recentFees || recentFees.length === 0) {
        return this.getDefaultFeeAnalysis()
      }

      // Extract fee values
      const fees = recentFees.map(fee => Number(fee.prioritizationFee)).sort((a, b) => a - b)
      
      // Calculate statistics
      const median = this.calculatePercentile(fees, 50)
      const p75 = this.calculatePercentile(fees, 75)
      const p90 = this.calculatePercentile(fees, 90)
      const max = Math.max(...fees)

      // Determine market condition
      const marketCondition = this.determineMarketCondition(median, p90, max)
      
      // Calculate recommended fee
      const recommendedFee = this.calculateBaseFeeRecommendation(median, p75, p90, marketCondition)
      
      // Store historical data
      this.updateHistoricalData({
        timestamp: Date.now(),
        fees,
        blockSlot: Number(recentFees[0]?.slot) || 0,
        congestionLevel: this.calculateCongestionLevel(p90, max)
      })

      console.log(`📊 [Arc Fees] Market analysis: ${marketCondition}, median: ${median}, recommended: ${recommendedFee}`)

      return {
        currentMedianFee: median,
        currentP75Fee: p75,
        currentP90Fee: p90,
        currentMaxFee: max,
        recommendedFee,
        confidence: this.calculateConfidence(fees.length, marketCondition),
        marketCondition
      }

    } catch (error) {
      console.warn('[Arc Fees] Failed to analyze fee market:', error)
      return this.getDefaultFeeAnalysis()
    }
  }

  /**
   * Get MEV protection recommendation
   * 
   * Analyzes transaction for MEV risks and recommends
   * appropriate protection strategies.
   */
  analyzeMevRisk(
    transactionValue: number,
    transactionType: 'swap' | 'transfer' | 'defi' | 'nft' | 'other'
  ): MevAnalysis {
    console.log(`🛡️ [Arc MEV] Analyzing MEV risk for ${transactionType} transaction`)

    const riskFactors = this.calculateMevRiskFactors(transactionValue, transactionType)
    const riskLevel = this.determineMevRiskLevel(riskFactors)
    const detectedThreats = this.identifyMevThreats(transactionType, transactionValue)
    
    const recommendedProtection: MevProtectionConfig = {
      enabled: riskLevel !== 'low',
      strategy: this.getRecommendedMevStrategy(riskLevel),
      maxSlippage: this.calculateMaxSlippage(transactionValue, riskLevel),
      frontrunProtection: riskLevel === 'high' || riskLevel === 'extreme',
      sandwichProtection: transactionType === 'swap' && riskLevel !== 'low',
      privateMempool: riskLevel === 'extreme',
      jitoTips: {
        enabled: riskLevel === 'high' || riskLevel === 'extreme',
        tipAmount: this.calculateJitoTip(transactionValue, riskLevel)
      }
    }

    return {
      riskLevel,
      detectedThreats,
      recommendedProtection,
      estimatedValue: transactionValue
    }
  }

  /**
   * Calculate dynamic fee adjustment
   * 
   * Adjusts fees based on real-time conditions and historical patterns.
   */
  async calculateDynamicFee(
    baseFee: number,
    targetConfirmationTime: number = 30
  ): Promise<number> {
    const analysis = await this.analyzeFeeMarket()
    
    // Calculate time-based multiplier
    const timeMultiplier = this.calculateTimeMultiplier(targetConfirmationTime, analysis.marketCondition)
    
    // Apply congestion adjustment
    const congestionMultiplier = this.calculateCongestionMultiplier(analysis)
    
    // Apply historical trend adjustment
    const trendMultiplier = this.calculateTrendMultiplier()
    
    const adjustedFee = baseFee * timeMultiplier * congestionMultiplier * trendMultiplier
    
    console.log(`🔄 [Arc Fees] Dynamic adjustment: ${baseFee} → ${Math.round(adjustedFee)} (${Math.round((adjustedFee / baseFee - 1) * 100)}%)`)
    
    return Math.round(adjustedFee)
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateFeeRecommendation(
    analysis: FeeAnalysis,
    config: PriorityFeeConfig
  ): FeeRecommendation {
    let microLamports: number
    let estimatedConfirmationTime: number
    let reasoning: string

    switch (config.strategy) {
      case 'conservative':
        microLamports = Math.max(analysis.currentMedianFee, 1000)
        estimatedConfirmationTime = 60
        reasoning = 'Conservative: Using median fee for cost optimization'
        break

      case 'moderate':
        microLamports = Math.max(analysis.currentP75Fee, 5000)
        estimatedConfirmationTime = 30
        reasoning = 'Moderate: Using 75th percentile for balanced speed/cost'
        break

      case 'aggressive':
        microLamports = Math.max(analysis.currentP90Fee, 10000)
        estimatedConfirmationTime = 15
        reasoning = 'Aggressive: Using 90th percentile for fast inclusion'
        break

      case 'ultra':
        microLamports = Math.max(analysis.currentMaxFee * 1.1, 50000)
        estimatedConfirmationTime = 5
        reasoning = 'Ultra: Using maximum fee + 10% for immediate inclusion'
        break

      case 'custom':
        microLamports = config.baseFeeMicroLamports || analysis.recommendedFee
        estimatedConfirmationTime = config.targetConfirmationTime || 30
        reasoning = 'Custom: Using user-specified parameters'
        break

      default:
        microLamports = analysis.recommendedFee
        estimatedConfirmationTime = 30
        reasoning = 'Default: Using calculated recommendation'
    }

    // Apply max fee limit if specified
    if (config.maxFeeMicroLamports) {
      microLamports = Math.min(microLamports, config.maxFeeMicroLamports)
    }

    return {
      microLamports,
      estimatedConfirmationTime,
      confidence: analysis.confidence,
      strategy: config.strategy,
      reasoning
    }
  }

  private applyDynamicAdjustment(
    recommendation: FeeRecommendation,
    analysis: FeeAnalysis,
    config: PriorityFeeConfig
  ): FeeRecommendation {
    const adjustmentFactor = config.adjustmentFactor || 1.0
    const adjustedFee = Math.round(recommendation.microLamports * adjustmentFactor)
    
    return {
      ...recommendation,
      microLamports: adjustedFee,
      reasoning: `${recommendation.reasoning} (dynamically adjusted by ${adjustmentFactor}x)`
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    
    if (sorted.length === 0) {
      return 0
    }
    
    if (sorted.length === 1) {
      return sorted[0]!
    }
    
    const index = (percentile / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) {
      return sorted[lower]!
    }
    
    const weight = index - lower
    const lowerValue = sorted[lower]!
    const upperValue = sorted[upper]!
    return lowerValue * (1 - weight) + upperValue * weight
  }

  private determineMarketCondition(
    median: number,
    p90: number,
    max: number
  ): 'calm' | 'busy' | 'congested' | 'extreme' {
    const spreadRatio = max / Math.max(median, 1)
    const p90Ratio = p90 / Math.max(median, 1)
    
    if (spreadRatio > 100 || max > 1000000) return 'extreme'
    if (spreadRatio > 20 || p90Ratio > 10) return 'congested'
    if (spreadRatio > 5 || p90Ratio > 3) return 'busy'
    return 'calm'
  }

  private calculateBaseFeeRecommendation(
    median: number,
    p75: number,
    p90: number,
    condition: string
  ): number {
    switch (condition) {
      case 'extreme': return Math.max(p90 * 1.5, 100000)
      case 'congested': return Math.max(p90, 50000)
      case 'busy': return Math.max(p75, 10000)
      case 'calm': return Math.max(median, 1000)
      default: return Math.max(p75, 5000)
    }
  }

  private calculateConfidence(sampleSize: number, condition: string): number {
    const baseConfidence = Math.min(sampleSize / 50, 1) // More samples = higher confidence
    const conditionFactor = condition === 'calm' ? 1.0 : 
                           condition === 'busy' ? 0.8 :
                           condition === 'congested' ? 0.6 : 0.4
    
    return baseConfidence * conditionFactor
  }

  private calculateCongestionLevel(p90: number, max: number): number {
    // Returns congestion level from 0-1
    const spreadRatio = max / Math.max(p90, 1)
    return Math.min(spreadRatio / 20, 1)
  }

  private updateHistoricalData(data: HistoricalFeeData): void {
    this.historicalData.push(data)
    
    // Keep only recent data
    if (this.historicalData.length > this.maxHistorySize) {
      this.historicalData.shift()
    }
  }

  private getDefaultFeeAnalysis(): FeeAnalysis {
    return {
      currentMedianFee: 5000,
      currentP75Fee: 10000,
      currentP90Fee: 25000,
      currentMaxFee: 100000,
      recommendedFee: 10000,
      confidence: 0.5,
      marketCondition: 'busy'
    }
  }

  private getFallbackRecommendation(config: PriorityFeeConfig): FeeRecommendation {
    const fallbackFees = {
      conservative: 1000,
      moderate: 5000,
      aggressive: 25000,
      ultra: 100000,
      custom: config.baseFeeMicroLamports || 5000
    }

    return {
      microLamports: fallbackFees[config.strategy],
      estimatedConfirmationTime: 30,
      confidence: 0.3,
      strategy: config.strategy,
      reasoning: 'Fallback: Using default fees due to analysis failure'
    }
  }

  // ===== MEV PROTECTION METHODS =====

  private calculateMevRiskFactors(value: number, type: string): {
    valueRisk: number
    typeRisk: number
    timingRisk: number
  } {
    // Value-based risk (higher value = higher risk)
    const valueRisk = Math.min(value / 100000, 1) // Normalize to 0-1
    
    // Transaction type risk
    const typeRiskMap = {
      swap: 0.9,     // High MEV risk
      defi: 0.8,     // High MEV risk  
      nft: 0.6,      // Medium MEV risk
      transfer: 0.2, // Low MEV risk
      other: 0.3     // Low-medium MEV risk
    }
    const typeRisk = typeRiskMap[type as keyof typeof typeRiskMap] || 0.3
    
    // Timing-based risk (simplified - would use market data in production)
    const timingRisk = 0.5
    
    return { valueRisk, typeRisk, timingRisk }
  }

  private determineMevRiskLevel(factors: {
    valueRisk: number
    typeRisk: number  
    timingRisk: number
  }): 'low' | 'medium' | 'high' | 'extreme' {
    const avgRisk = (factors.valueRisk + factors.typeRisk + factors.timingRisk) / 3
    
    if (avgRisk > 0.8) return 'extreme'
    if (avgRisk > 0.6) return 'high'
    if (avgRisk > 0.4) return 'medium'
    return 'low'
  }

  private identifyMevThreats(type: string, value: number): string[] {
    const threats: string[] = []
    
    if (type === 'swap') {
      threats.push('Sandwich attacks')
      threats.push('Front-running')
      if (value > 10000) threats.push('Back-running')
    }
    
    if (type === 'defi') {
      threats.push('Liquidation front-running')
      threats.push('Arbitrage extraction')
    }
    
    if (value > 50000) {
      threats.push('Large transaction targeting')
    }
    
    return threats
  }

  private getRecommendedMevStrategy(riskLevel: string): 'basic' | 'advanced' | 'aggressive' {
    switch (riskLevel) {
      case 'extreme': return 'aggressive'
      case 'high': return 'advanced'
      case 'medium': return 'basic'
      default: return 'basic'
    }
  }

  private calculateMaxSlippage(value: number, riskLevel: string): number {
    const baseSlippage = {
      low: 0.01,      // 1%
      medium: 0.005,  // 0.5%
      high: 0.003,    // 0.3%
      extreme: 0.001  // 0.1%
    }
    
    return baseSlippage[riskLevel as keyof typeof baseSlippage] || 0.01
  }

  private calculateJitoTip(value: number, riskLevel: string): number {
    if (riskLevel === 'low' || riskLevel === 'medium') return 0
    
    // Calculate tip based on value (0.01% to 0.1% of transaction value)
    const tipPercentage = riskLevel === 'extreme' ? 0.001 : 0.0001
    return Math.min(Math.max(value * tipPercentage, 1000), 100000) // Min 0.001 SOL, max 0.1 SOL
  }

  private calculateTimeMultiplier(
    targetTime: number,
    condition: string
  ): number {
    const conditionMultipliers = {
      calm: 1.0,
      busy: 1.2,
      congested: 1.5,
      extreme: 2.0
    }
    
    const baseMultiplier = conditionMultipliers[condition as keyof typeof conditionMultipliers] || 1.0
    
    // Faster target time = higher multiplier
    const timeMultiplier = Math.max(0.5, 60 / targetTime)
    
    return baseMultiplier * timeMultiplier
  }

  private calculateCongestionMultiplier(analysis: FeeAnalysis): number {
    switch (analysis.marketCondition) {
      case 'extreme': return 2.0
      case 'congested': return 1.5
      case 'busy': return 1.2
      case 'calm': return 1.0
      default: return 1.0
    }
  }

  private calculateTrendMultiplier(): number {
    if (this.historicalData.length < 5) return 1.0
    
    // Calculate trend from recent data
    const recent = this.historicalData.slice(-5)
    const oldAvg = recent.slice(0, 2).reduce((sum, data) => 
      sum + data.fees.reduce((s, f) => s + f, 0) / data.fees.length, 0) / 2
    const newAvg = recent.slice(-2).reduce((sum, data) => 
      sum + data.fees.reduce((s, f) => s + f, 0) / data.fees.length, 0) / 2
    
    const trendRatio = newAvg / Math.max(oldAvg, 1)
    
    // Clamp trend multiplier between 0.8 and 1.5
    return Math.min(Math.max(trendRatio, 0.8), 1.5)
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create priority fee optimizer
 */
export function createPriorityFeeOptimizer(
  rpcUrl: string,
  commitment?: 'processed' | 'confirmed' | 'finalized'
): PriorityFeeOptimizer {
  return new PriorityFeeOptimizer(rpcUrl, commitment)
}

/**
 * Quick fee recommendation
 */
export async function getQuickFeeRecommendation(
  rpcUrl: string,
  strategy: 'conservative' | 'moderate' | 'aggressive' | 'ultra' = 'moderate'
): Promise<number> {
  const optimizer = createPriorityFeeOptimizer(rpcUrl)
  const recommendation = await optimizer.getOptimalFee({ strategy })
  return recommendation.microLamports
}

/**
 * MEV-protected fee calculation
 */
export async function getMevProtectedFee(
  rpcUrl: string,
  transactionValue: number,
  transactionType: 'swap' | 'transfer' | 'defi' | 'nft' | 'other' = 'other'
): Promise<{
  priorityFee: number
  mevProtection: MevProtectionConfig
  totalCost: number
}> {
  const optimizer = createPriorityFeeOptimizer(rpcUrl)
  
  // Get MEV analysis
  const mevAnalysis = optimizer.analyzeMevRisk(transactionValue, transactionType)
  
  // Get appropriate fee strategy based on MEV risk
  const feeStrategy = mevAnalysis.riskLevel === 'extreme' ? 'ultra' :
                     mevAnalysis.riskLevel === 'high' ? 'aggressive' :
                     mevAnalysis.riskLevel === 'medium' ? 'moderate' : 'conservative'
  
  const feeRecommendation = await optimizer.getOptimalFee({ 
    strategy: feeStrategy,
    mevProtection: true
  })
  
  const jitoTip = mevAnalysis.recommendedProtection.jitoTips?.tipAmount || 0
  const totalCost = feeRecommendation.microLamports + jitoTip
  
  return {
    priorityFee: feeRecommendation.microLamports,
    mevProtection: mevAnalysis.recommendedProtection,
    totalCost
  }
}
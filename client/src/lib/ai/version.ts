// AI System Version Management
// This file tracks AI system capabilities and versions

export interface AIVersion {
  version: string
  name: string
  features: string[]
  releaseDate: string
}

export const AI_VERSIONS: Record<string, AIVersion> = {
  'v1.0': {
    version: 'v1.0',
    name: 'Basic AI',
    features: ['Basic sentiment analysis', 'Simple mood detection'],
    releaseDate: '2024-08-01'
  },
  'v2.0': {
    version: 'v2.0',
    name: 'Enhanced AI',
    features: ['Advanced sentiment analysis', 'Business categorization', 'Single-sentence insights'],
    releaseDate: '2024-08-10'
  },
  'v3.0': {
    version: 'v3.0',
    name: 'Business Intelligence AI',
    features: [
      'Hugging Face cardiffnlp sentiment analysis',
      'j-hartmann emotion detection',
      '2-3 sentence business insights',
      'Content-aware business categorization',
      'API quota protection system',
      'Graceful fallback analysis',
      '85-95% accuracy confidence scoring'
    ],
    releaseDate: '2025-08-13'
  }
}

export const CURRENT_AI_VERSION = 'v3.0'

export function getCurrentAIVersion(): AIVersion {
  return AI_VERSIONS[CURRENT_AI_VERSION]
}

export function getVersionDisplayText(): string {
  const current = getCurrentAIVersion()
  return `${current.name} ${current.version}`
}

export function getAICapabilities(): string[] {
  return getCurrentAIVersion().features
}

// Determine version based on analysis source
export function getVersionFromAnalysisSource(analysisSource?: string): string {
  if (!analysisSource) return CURRENT_AI_VERSION
  
  if (analysisSource.includes('hugging-face')) {
    return 'v3.0' // Current Hugging Face implementation
  } else if (analysisSource.includes('enhanced') || analysisSource.includes('local')) {
    return 'v2.0' // Enhanced local analysis
  } else {
    return 'v1.0' // Basic analysis
  }
}

export function getVersionDisplayFromSource(analysisSource?: string): string {
  const version = getVersionFromAnalysisSource(analysisSource)
  const versionInfo = AI_VERSIONS[version]
  return `${versionInfo.name} ${versionInfo.version}`
}
import { NetworkAccountResponse, ConfigComparison, ComparisonResult } from './types'

export function compareConfigs(response: NetworkAccountResponse): ComparisonResult[] {
  const currentConfig = response.networkAccount.data.current
  const results: ComparisonResult[] = []

  const comparisons: ConfigComparison[] = Object.entries(currentConfig).map(([key, value]) => {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return {
        parameter: key,
        expected: 'N/A',
        actual: value.value,
        matches: true,
      }
    }

    return {
      parameter: key,
      expected: 'N/A',
      actual: value,
      matches: true,
    }
  })

  results.push({
    section: 'Network Configuration',
    comparisons,
    hasMismatches: false,
  })

  return results
}

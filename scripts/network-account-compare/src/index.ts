import { Command } from 'commander'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { NetworkAccountResponse } from './types'
import { ENVIRONMENT_CONFIGS } from './config'

const SPECIAL_KEYS = ['multisigKeys', 'devPublicKeys'] as const

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

const program = new Command()

program
  .name('network-account-compare')
  .description('CLI tool to compare network account changes with environment configs')
  .version('1.0.0')

program
  .option('-u, --url <url>', 'Archiver URL to fetch network account data (optional if environment is specified)')
  .requiredOption(
    '-e, --environment <environment>',
    'Environment to compare against (mainnet, testnet, stagenet, devnetUs, devnetApac, local)'
  )
  .option('-v, --verbose', 'Enable verbose output', false)

program.parse(process.argv)
const options = program.opts()

// Validate environment
if (!ENVIRONMENT_CONFIGS[options.environment]) {
  console.error(
    `${COLORS.red}Error:${COLORS.reset} Invalid environment '${options.environment}'. Must be one of: ${Object.keys(
      ENVIRONMENT_CONFIGS
    ).join(', ')}`
  )
  process.exit(1)
}

async function fetchNetworkAccount(url: string): Promise<NetworkAccountResponse> {
  try {
    const response = await axios.get<NetworkAccountResponse>(url)
    return response.data
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`${COLORS.red}Error fetching network account:${COLORS.reset} ${error.message}`)
    } else {
      console.error(`${COLORS.red}Error fetching network account: Unknown error${COLORS.reset}`)
    }
    process.exit(1)
  }
}

function loadEnvironmentConfig(environment: string): any {
  const configPath = path.join(__dirname, '..', '..', '..', 'environments', `${environment}.config.json`)
  try {
    const configData = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(configData)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`${COLORS.red}Error loading ${environment} config:${COLORS.reset} ${error.message}`)
    } else {
      console.error(`${COLORS.red}Error loading ${environment} config: Unknown error${COLORS.reset}`)
    }
    process.exit(1)
  }
}

function formatValue(value: any): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function compareNestedValues(networkValue: any, envValue: any, path = ''): { matches: boolean; mismatches?: string[] } {
  const currentKey = path.split('.').pop()
  const isSpecialKey = currentKey && SPECIAL_KEYS.includes(currentKey as typeof SPECIAL_KEYS[number])

  // Skip undefined comparisons for non-special keys
  if (!isSpecialKey && (networkValue === undefined || envValue === undefined)) {
    return { matches: true }
  }

  if (typeof networkValue !== typeof envValue) {
    return { matches: false, mismatches: [`Type mismatch: ${typeof networkValue} vs ${typeof envValue}`] }
  }

  if (typeof networkValue !== 'object' || networkValue === null) {
    return {
      matches: JSON.stringify(networkValue) === JSON.stringify(envValue),
      mismatches:
        JSON.stringify(networkValue) !== JSON.stringify(envValue)
          ? [`Value mismatch: ${formatValue(networkValue)} vs ${formatValue(envValue)}`]
          : undefined,
    }
  }

  const networkKeys = Object.keys(networkValue)
  const envKeys = Object.keys(envValue)
  const mismatches: string[] = []

  if (isSpecialKey) {
    const networkKeySet = new Set(networkKeys)
    const envKeySet = new Set(envKeys)

    networkKeySet.forEach((key) => {
      if (!envKeySet.has(key)) {
        mismatches.push(`Missing in environment: ${key}`)
      }
    })

    envKeySet.forEach((key) => {
      if (!networkKeySet.has(key)) {
        mismatches.push(`Missing in network: ${key}`)
      }
    })

    return {
      matches: mismatches.length === 0,
      mismatches: mismatches.length > 0 ? mismatches : undefined,
    }
  }

  envKeys.forEach((key) => {
    if (!networkKeys.includes(key)) {
      mismatches.push(`Missing in network: ${key}`)
    }
  })

  networkKeys.forEach((key) => {
    if (envKeys.includes(key)) {
      const result = compareNestedValues(networkValue[key], envValue[key], `${path}.${key}`)
      if (!result.matches && result.mismatches) {
        mismatches.push(...result.mismatches.map((m) => `${key}.${m}`))
      }
    }
  })

  return {
    matches: mismatches.length === 0,
    mismatches: mismatches.length > 0 ? mismatches : undefined,
  }
}

function compareChanges(networkAccount: NetworkAccountResponse, envConfig: any): void {
  const changes = networkAccount.networkAccount.data.listOfChanges
  const envChanges = envConfig.server || {}

  console.log(`\n${COLORS.bold}Comparing Network Account Changes with Environment Config${COLORS.reset}`)
  console.log(`${COLORS.dim}=======================================================${COLORS.reset}`)

  let hasMismatches = false

  changes.forEach((change: { cycle: number; change: Record<string, any> }, index: number) => {
    let hasCycleMismatches = false

    Object.entries(change.change).forEach(([key, value]) => {
      const envValue = key.split('.').reduce((obj, k) => obj?.[k], envChanges)
      const result = compareNestedValues(value, envValue, key)

      if (!result.matches) {
        if (!hasCycleMismatches) {
          console.log(`\n${COLORS.cyan}Change #${index + 1} (Cycle ${change.cycle}):${COLORS.reset}`)
          console.log(`${COLORS.dim}----------------------------------------${COLORS.reset}`)
          hasCycleMismatches = true
          hasMismatches = true
        }
        if (result.mismatches) {
          console.log(`${COLORS.dim}  Details:${COLORS.reset}`)
          result.mismatches.forEach((mismatch) => {
            console.log(`    ${COLORS.red}✗${COLORS.reset} ${mismatch}`)
          })
        }
      }
    })
  })

  if (!hasMismatches) {
    console.log(`\n${COLORS.green}✓ No mismatches found between Network Account and Environment Config${COLORS.reset}`)
  }
}

async function main(): Promise<void> {
  try {
    const archiverUrl = options.url || ENVIRONMENT_CONFIGS[options.environment]?.archiverUrl

    if (!archiverUrl) {
      console.error(
        `${COLORS.red}Error:${COLORS.reset} No archiver URL found for environment '${options.environment}'. Please provide a URL using --url or check the environment configuration.`
      )
      process.exit(1)
    }

    console.log(`${COLORS.blue}Fetching network account data from ${archiverUrl}...${COLORS.reset}`)
    const networkAccount = await fetchNetworkAccount(`${archiverUrl}/get-network-account?hash=false`)

    console.log(`${COLORS.blue}Loading environment config...${COLORS.reset}`)
    const envConfig = loadEnvironmentConfig(options.environment)

    compareChanges(networkAccount, envConfig)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`${COLORS.red}Error:${COLORS.reset} ${error.message}`)
    } else {
      console.error(`${COLORS.red}Error: Unknown error${COLORS.reset}`)
    }
    process.exit(1)
  }
}

main()

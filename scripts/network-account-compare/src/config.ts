export interface EnvironmentConfig {
  archiverUrl: string
}

export const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  mainnet: {
    archiverUrl: 'http://35.238.248.68:4000',
  },
  testnet: {
    archiverUrl: 'http://104.197.117.164:4000',
  },
  stagenet: {
    archiverUrl: 'http://34.57.177.170:4000',
  },
  devnetUs: {
    archiverUrl: 'http://35.227.45.34:4000',
  },
  devnetApac: {
    archiverUrl: 'http://35.243.187.134:4000',
  },
  local: {
    archiverUrl: 'http://localhost:4000',
  },
}

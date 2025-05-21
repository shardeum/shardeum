import { initPenaltyTxStorage } from '../src/tx/penalty/penaltyTxStorage'

async function main(): Promise<void> {
  initPenaltyTxStorage()
  console.log('Penalty transaction storage initialized')
}

main().catch((e) => {
  console.error('Failed to initialize penalty transaction storage', e)
})

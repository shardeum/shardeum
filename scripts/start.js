const execa = require('execa')

const archiverPath = require.resolve('archive-server')
const monitorPath = require.resolve('monitor-server')

async function main () {
  try {
    await execa('yarpm', `run pm2 start --no-autorestart ${archiverPath}`.split(' '), { stdio: [0, 1, 2] })
    await execa('yarpm', `run pm2 start --no-autorestart ${monitorPath}`.split(' '), { stdio: [0, 1, 2] })
    console.log()
    console.log('\x1b[33m%s\x1b[0m', 'View network monitor at:') // Yellow
    console.log('  http://localhost:\x1b[32m%s\x1b[0m', '3000') // Green
    console.log()
  } catch (e) {
    console.log(e)
  }
}
main()

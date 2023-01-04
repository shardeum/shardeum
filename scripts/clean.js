const { rm } = require('shelljs')

async function main () {
  try {
    rm('-rf', './.pm2 ./db ./logs ./statistics.tsv'.split(' '))
    rm('-rf', './archiver-db.sqlite'.split(' '))
    rm('-rf', './archiver-db'.split(' '))
    rm('-rf', './archiver-logs'.split(' '))
    rm('-rf', './monitor-logs'.split(' '))
  } catch (e) {
    console.log(e)
  }
}
main()

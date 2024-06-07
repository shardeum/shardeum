import { Utils } from '@shardus/types'

let stringify = require('fast-json-stable-stringify')
const fs = require('fs')
const path = require('path')

const myArgs = process.argv.slice(2)
const directory = myArgs[0] //`paste path here`;

//hacky little script to make a folder of json files have a stable key sort
fs.readdir(directory, (err, files) => {
  files.forEach(file => {
    try {
      let filepath = path.resolve(directory, file)
      let fileText = fs.readFileSync(filepath)
      let fileObj = Utils.safeJsonParse(fileText)
      console.log(file)

      let stablePrint = Utils.safeStringify(fileObj)
      let filepath2 = path.resolve(directory, file + '.update.txt')
      console.log(filepath2)
      fs.writeFileSync(filepath2, stablePrint)
    } catch (error) {
      //console.log(error);
    }
  })
})

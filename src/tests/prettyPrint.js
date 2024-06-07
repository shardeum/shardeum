import { Utils } from '@shardus/types'

const fs = require('fs')
const path = require('path')

const myArgs = process.argv.slice(2)
const directory = myArgs[0] //`paste path here`;

//script to pretty print a folder of json files
fs.readdir(directory, (err, files) => {
  files.forEach(file => {
    try {
      let filepath = path.resolve(directory, file)
      let fileText = fs.readFileSync(filepath)
      let fileObj = Utils.safeJsonParse(fileText)
      console.log(file)

      var prettyPrint = Utils.safeStringify(fileObj, null, 2)
      let filepath2 = path.resolve(directory, file + '.update.json')
      console.log(filepath2)
      fs.writeFileSync(filepath2, prettyPrint)
    } catch (error) {
      //console.log(error);
    }
  })
})

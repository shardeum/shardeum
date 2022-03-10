let stringify = require( 'fast-json-stable-stringify')
const fs = require('fs');
const path = require('path')

const directory = `paste path here`;

//hacky little script to make a folder of json files have a stable key sort
fs.readdir(directory, (err, files) => {
    files.forEach(file => {
        try{
            let filepath = path.resolve(directory, file);
            let fileText = fs.readFileSync(filepath)
            let fileObj = JSON.parse(fileText)
            console.log(file);

            let stablePrint = stringify(fileObj)
            let filepath2 = path.resolve(directory, file + '.update.txt');
            console.log(filepath2);
            fs.writeFileSync(filepath2,stablePrint)
        } catch(error) {
            //console.log(error);
        }
    });
});

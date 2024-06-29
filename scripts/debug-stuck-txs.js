const http = require('http');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Function to prompt the user for input
function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

// Function to fetch data from a given port
function fetchDataFromPort(port) {
    const url = `http://localhost:${port}/debug-queue-items`;

    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on('error', (err) => {
            console.error(`Error fetching data from port ${port}: ${err.message}`);
            resolve(null);
        });
    });
}

// Function to save data to a file
function saveDataToFile(port, data) {
    const directory = `stuck-tx-debugging/queryResults/${port}`;

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const filePath = path.join(directory, `port_${port}_data.json`);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

// Function to process the data and create stuck-tx-info.json
function processFilesAndCreateSummary() {
    const rootDirectory = 'stuck-tx-debugging';
    const queryResultsDirectory = path.join(rootDirectory, 'queryResults');
    const summaryFilePath = path.join(rootDirectory, 'stuck-tx-info.json');
    const summaryData = {};

    const directories = fs.readdirSync(queryResultsDirectory, { withFileTypes: true });

    directories.forEach(dir => {
        if (dir.isDirectory()) {
            const files = fs.readdirSync(path.join(queryResultsDirectory, dir.name));
            const port = dir.name;

            files.forEach(file => {
                const filePath = path.join(queryResultsDirectory, port, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                data.forEach(item => {
                    const logID = item.logID;
                    if (!summaryData[logID]) {
                        summaryData[logID] = {
                            totalVotes: 0,
                            goodVotes: 0,
                            nodeResults: {}
                        };
                    }

                    const summaryItem = summaryData[logID];
                    summaryItem.totalVotes += 1;
                    const ourVote = item.ourVote;
                    const preApplyResult = item.preApplyResult;
                    const isOurVoteTruthy = ourVote ? true : false;
                    const isPreApplyResultTruthy = preApplyResult ? true : false;

                    summaryItem.nodeResults[port] = {
                        theirVote: isOurVoteTruthy ? ourVote : 'ourVote not present or not truthy',
                        theirPreApplyResult: isPreApplyResultTruthy ? preApplyResult : 'preApplyResult not present or not truthy'
                    };

                    if (isOurVoteTruthy && isPreApplyResultTruthy) {
                        summaryItem.goodVotes += 1;
                    }
                });
            });
        }
    });

    fs.writeFileSync(summaryFilePath, JSON.stringify(summaryData, null, 4));
}

// Main function
async function main() {
    const startPort = parseInt(await prompt('Enter the start port: '), 10);
    const endPort = parseInt(await prompt('Enter the end port: '), 10);

    for (let port = startPort; port <= endPort; port++) {
        const data = await fetchDataFromPort(port);

        if (data !== null) {
            saveDataToFile(port, data);
            console.log(`Data from port ${port} saved successfully.`);
        } else {
            console.log(`No data to save for port ${port}.`);
        }
    }

    processFilesAndCreateSummary();
}

main();

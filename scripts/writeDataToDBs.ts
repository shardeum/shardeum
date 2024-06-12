
// This script will clear all existing data in the databases and 
// add the dummy account data defined below to the
// databases(archiverdb and all individual validator instance databases)

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs-extra');
const path = require('path');


// Define the DB paths
const archiverDbPath = path.join(__dirname, '../../instances', 'archiver-db-4000', 'archiverdb-4000.sqlite3');
const instancesDir = path.join(__dirname, '../../instances');

const accountsData = [
    {
        accountId: '0x03a03a21bd8a57a1ede8c74845226cd1b5674ba4',
        data: JSON.stringify({
            account: {
                balance: "3643aa647986040000",
                codeHash: {
                    data: "xdJGAYb3IzySfn2y3McDwOUAtlPKgic7e/rYBF2FpHA=",
                    dataType: "bh"
                },
                nonce: "0",
                storageRoot: {
                    data: "VugfFxvMVab/g0XmksD4bltI4BuZbK3AAWIvteNjtCE=",
                    dataType: "bh"
                }
            },
            accountType: 0,
            ethAddress: "0x03a03a21bd8a57a1ede8c74845226cd1b5674ba4",
            hash: "4a0f420d3691e458cda658beac0761d2ae0256b64402c9fbd1dbc1146bc1f9e9",
            timestamp: 1718107086000
        }),
        timestamp: 1718107086000,
        hash: "4a0f420d3691e458cda658beac0761d2ae0256b64402c9fbd1dbc1146bc1f9e9",
        cycleNumber: 1,
        isGlobal: 0
    },
    {
        accountId: '0x4a372f3f5cfa12ce491106bdd82735764ea29d62',
        data: JSON.stringify({
            account: {
                balance: "8459523f4b7fbf1640000",
                codeHash: {
                    data: "xdJGAYb3IzySfn2y3McDwOUAtlPKgic7e/rYBF2FpHA=",
                    dataType: "bh"
                },
                nonce: "0",
                storageRoot: {
                    data: "VugfFxvMVab/g0XmksD4bltI4BuZbK3AAWIvteNjtCE=",
                    dataType: "bh"
                }
            },
            accountType: 0,
            ethAddress: "0x4a372f3f5cfa12ce491106bdd82735764ea29d62",
            hash: "d4558d806039edef40423af14917784595da13562effc8c790672e8ee49d8d5d",
            timestamp: 1718021762000
        }),
        timestamp: 1718021762000,
        hash: "d4558d806039edef40423af14917784595da13562effc8c790672e8ee49d8d5d",
        cycleNumber: 2,
        isGlobal: 1
    }
];

async function checkFileAccess(filePath) {
    try {
        await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
        console.log(`${filePath} is accessible.`);
    } catch (err) {
        console.error(`${filePath} is not accessible.`, err);
        throw err;
    }
}

function clearTables(db, tableName) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`DELETE FROM ${tableName}`, (err) => {
                if (err) {
                    return reject(err);
                }
                db.run(`VACUUM`, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(`Cleared table ${tableName} successfully`);
                });
            });
        });
    });
}

function addDummyData(db, tableName, isAccountsEntryTable) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            const insertDataQueries = accountsData.map(account => {
                return new Promise((resolve, reject) => {
                    const query = isAccountsEntryTable
                        ? `INSERT INTO ${tableName} (accountId, data, timestamp) VALUES (?, ?, ?)`
                        : `INSERT INTO ${tableName} (accountId, data, timestamp, hash, cycleNumber, isGlobal) VALUES (?, ?, ?, ?, ?, ?)`;
                    const values = isAccountsEntryTable
                        ? [account.accountId, account.data, account.timestamp]
                        : [account.accountId, account.data, account.timestamp, account.hash, account.cycleNumber, account.isGlobal];

                    db.run(query, values, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(`Inserted dummy data into ${tableName}`);
                    });
                });
            });

            Promise.all(insertDataQueries).then(resolve).catch(reject);
        });
    });
}

async function processDatabase(dbPath, tableName, isAccountsEntryTable = false) {
    try {
        await checkFileAccess(dbPath);
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
                throw err;
            }
        });

        await clearTables(db, tableName);
        console.log(`Cleared table ${tableName} successfully`);

        await addDummyData(db, tableName, isAccountsEntryTable);
        console.log(`Added dummy data successfully`);

        db.close((err) => {
            if (err) {
                console.error(err.message);
                throw err;
            }
        });
    } catch (err) {
        console.error(`Error processing database ${dbPath}:`, err);
    }
}

async function processArchiverDb() {
    await processDatabase(archiverDbPath, 'accounts');
}

async function processInstanceDbs() {
    try {
        const instanceDirs = await fs.readdir(instancesDir);

        for (const instanceDir of instanceDirs) {
            const dbPath = path.join(instancesDir, instanceDir, 'db', 'shardeum.sqlite');
            if (await fs.pathExists(dbPath)) {
                await processDatabase(dbPath, 'accountsEntry', true);
            } else {
                console.log(`Skipping ${instanceDir}, no shardeum.sqlite file found.`);
            }
        }
    } catch (err) {
        console.error('Error during database modification:', err);
    }
}

async function main() {
    await processArchiverDb();
    await processInstanceDbs();
}

main();

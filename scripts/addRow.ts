// This script adds a single row to the accountsEntry table in 
// all instance databases and the accounts table in the archiver database.

import sqlite3 from 'sqlite3';
import fs from 'fs-extra';
import path from 'path';

const archiverDbPath = path.join(__dirname, '../../instances', 'archiver-db-4000', 'archiverdb-4000.sqlite3');
const instancesDir = path.join(__dirname, '../../instances');

// Define the new account data (will be addded to) the instance DBs
const newAccountData = {
    accountId: '0xBf0B30cf75Dc74d982Ddc75B4920aC2bD5d85e35',
    data: JSON.stringify({
        account: {
            balance: "8459523f4b7fbf1640000",
            codeHash: {
                data: "exampleData",
                dataType: "bh"
            },
            nonce: "0",
            storageRoot: {
                data: "exampleRoot",
                dataType: "bh"
            }
        },
        accountType: 0,
        ethAddress: "0xBf0B30cf75Dc74d982Ddc75B4920aC2bD5d85e35",
        hash: "newAccountHash",
        timestamp: 1718021762000
    }),
    timestamp: 1718021762000
};

//  new account data (will be added to) the archiver DB
const newArchiverAccountData = {
    accountId: '0xBf0B30cf75Dc74d982Ddc75B4920aC2bD5d85e35',
    data: JSON.stringify({
        account: {
            balance: "8459523f4b7fbf1640000",
            codeHash: {
                data: "exampleData",
                dataType: "bh"
            },
            nonce: "0",
            storageRoot: {
                data: "exampleRoot",
                dataType: "bh"
            }
        },
        accountType: 0,
        ethAddress: "0xBf0B30cf75Dc74d982Ddc75B4920aC2bD5d85e35",
        hash: "newArchiverAccountHash",
        timestamp: 1718021762000
    }),
    timestamp: 1718021762000,
    hash: "newArchiverAccountHash",
    cycleNumber: 1,
    isGlobal: 0
};

// Function to check file access
async function checkFileAccess(filePath: string) {
    try {
        await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
        console.log(`${filePath} is accessible.`);
    } catch (err) {
        console.error(`${filePath} is not accessible.`, err);
        throw err;
    }
}

// Function to add a row to the database
async function addRowToDatabase(dbPath: string, tableName: string, accountData: any, isAccountsEntryTable: boolean = false) {
    try {
        await checkFileAccess(dbPath);
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
                throw err;
            }
        });

        db.serialize(() => {
            const query = isAccountsEntryTable
                ? `INSERT INTO ${tableName} (accountId, data, timestamp) VALUES (?, ?, ?)`
                : `INSERT INTO ${tableName} (accountId, data, timestamp, hash, cycleNumber, isGlobal) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = isAccountsEntryTable
                ? [accountData.accountId, accountData.data, accountData.timestamp]
                : [accountData.accountId, accountData.data, accountData.timestamp, accountData.hash, accountData.cycleNumber, accountData.isGlobal];

            db.run(query, values, (err) => {
                if (err) {
                    console.error(`Error inserting into ${tableName}:`, err.message);
                    return;
                }
                console.log(`Inserted new row into ${tableName} successfully`);
            });
        });

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

// add a row to the archiver DB
async function addRowToArchiverDb() {
    await addRowToDatabase(archiverDbPath, 'accounts', newArchiverAccountData);
}

// add a row to the instance DBs
async function addRowToInstanceDbs() {
    try {
        const instanceDirs = await fs.readdir(instancesDir);

        for (const instanceDir of instanceDirs) {
            const dbPath = path.join(instancesDir, instanceDir, 'db', 'shardeum.sqlite');
            if (await fs.pathExists(dbPath)) {
                await addRowToDatabase(dbPath, 'accountsEntry', newAccountData, true);
            } else {
                console.log(`Skipping ${instanceDir}, no shardeum.sqlite file found.`);
            }
        }
    } catch (err) {
        console.error('Error during database modification:', err);
    }
}

async function main() {
    await addRowToArchiverDb();
    await addRowToInstanceDbs();
}

main();

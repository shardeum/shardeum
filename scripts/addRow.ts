import sqlite3 from 'sqlite3';
import fs from 'fs-extra';
import path from 'path';

const archiverDbPath = path.join(__dirname, '../../instances', 'archiver-db-4000', 'archiverdb-4000.sqlite3');

const newArchiverAccountData = {
    accountId: 'f800a96506c75a73a66d0cdbf869e6467b0b3dca000000000000000000000000',
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
        ethAddress: "0xEbe754843fd57D198286B2F4eD5C998408E58b5d",
        hash: "800e9303308c0ab567bfff587b8e63213e7f1f0a30e53d582d2f171b5f202a90",
        timestamp: 1718743489583
    }),
    timestamp: 1718743489583,
    hash: "800e9303308c0ab567bfff587b8e63213e7f1f0a30e53d582d2f171b5f202a90",
    cycleNumber: 2,
    isGlobal: 0
};

// Function to check file access
async function checkFileAccess(filePath: string) {
    try {
        await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
        // console.log(`${filePath} is accessible.`);
    } catch (err) {
        console.error(`${filePath} is not accessible.`, err);
        throw err;
    }
}

// Function to add a row to the database
async function addRowToDatabase(dbPath: string, tableName: string, accountData: any) {
    try {
        await checkFileAccess(dbPath);
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
                throw err;
            }
        });

        db.serialize(() => {
            const query = `INSERT INTO ${tableName} (accountId, data, timestamp, hash, cycleNumber, isGlobal) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [accountData.accountId, accountData.data, accountData.timestamp, accountData.hash, accountData.cycleNumber, accountData.isGlobal];

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

// Add a row to the archiver DB
async function addRowToArchiverDb() {
    await addRowToDatabase(archiverDbPath, 'accounts', newArchiverAccountData);
}

async function main() {
    await addRowToArchiverDb();
}

main();

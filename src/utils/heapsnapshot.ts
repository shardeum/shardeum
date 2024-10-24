import { createWriteStream, WriteStream } from 'fs';
import { resolve } from 'path';
import { Readable } from 'stream';
import { getHeapSnapshot } from 'v8';
import { ShardeumFlags } from '../shardeum/shardeumFlags';
import * as heapdump from 'heapdump';


export function generateHeapDump(fileName?: string): void {
    console.log('DEBUG: heapsnapshot: inside generateHeapDump');
    try {
        // Generate a default file name if not provided
        if (!fileName) {
            const timestamp: string = new Date().toISOString().replace(/:/g, '-');
            fileName = `heapdump-${timestamp}.heapsnapshot`;
        }
        //__dirname
        const filePath: string = resolve(process.cwd(), fileName);

        const startTime = Date.now()

        // Get the heap snapshot stream from v8
        const heapSnapshotStream: Readable = getHeapSnapshot();

        // Create a write stream to save the heap snapshot
        const writeStream: WriteStream = createWriteStream(filePath);

        // Pipe the heap snapshot to the file
        heapSnapshotStream.pipe(writeStream);

        // Handle finish event
        writeStream.on('finish', () => {
            console.log(`DEBUG: Heap dump written in ${Date.now()-startTime} to ${filePath}`);
        });

        // Handle errors during the write process
        writeStream.on('error', (err: NodeJS.ErrnoException) => {
            console.error('Error writing heap dump:', err);
            console.log('DEBUG: heapsnapshot: Error writing heap dump:', err);
        });

    } catch (error) {
        console.error('Failed to generate heap dump:', error);
    }
}


//trying out the npm library to see if we have better luck with it..
export function generateHeapDump2(fileName?: string): void {
    console.log('DEBUG: heapsnapshot: inside generateHeapDump2');
    try {
        // Generate a default file name if not provided
        if (!fileName) {
            const timestamp: string = new Date().toISOString().replace(/:/g, '-');
            fileName = `heapdump-${timestamp}.heapsnapshot`;
        }
        console.log('DEBUG: heapsnapshot: fileName:', fileName);

        // Resolve the file path relative to the current working directory
        const filePath: string = resolve(process.cwd(), fileName);
        const startTime = Date.now();

        // Trigger the heap dump using the heapdump library
        heapdump.writeSnapshot(filePath, (err: Error | null, filename: string) => {
            if (err) {
                console.error('Error writing heap dump:', err);
                console.log('DEBUG: heapsnapshot: Error writing heap dump:', err);
            } else {
                console.log(`DEBUG: heapsnapshot: Heap dump written in ${Date.now() - startTime} ms to ${filename}`);
            }
        });

    } catch (error) {
        console.error('Failed to generate heap dump:', error);
        console.log('DEBUG: heapsnapshot: Failed to generate heap dump:', error);
    }
}

export function enableHeapdump(shardus){
    console.log('DEBUG: heapsnapshot: inside enableHeapdump');
    // Or trigger based on a signal, for example:
    process.on('SIGUSR2', () => {
        if(ShardeumFlags.EnableHeapdump === 1){
            console.log('DEBUG: SIGUSR2 received, generating heap dump...');
            generateHeapDump();            
        } else if(ShardeumFlags.EnableHeapdump === 2) {
            console.log('DEBUG: SIGUSR2 received, generating heap dump 2...');
            //do not check this in!
            generateHeapDump2(); 
        }


    });


}
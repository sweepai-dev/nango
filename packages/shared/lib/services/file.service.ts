import { PutObjectCommand, GetObjectCommand, GetObjectCommandOutput, S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { isCloud } from '../utils/utils.js';
import errorManager from '../utils/error.manager.js';

const client = new S3Client({
    region: process.env['AWS_REGION'] as string,
    credentials: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'] as string,
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] as string
    }
});

class FileService {
    bucket = process.env['AWS_BUCKET_NAME'] as string;

    async upload(fileContents: string, fileName: string): Promise<string | null> {
        if (!isCloud()) {
            return '_LOCAL_FILE_';
        }

        try {
            await client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                    Body: fileContents
                })
            );

            return fileName;
        } catch (e) {
            errorManager.report(e, {
                metadata: {
                    fileName
                }
            });

            return null;
        }
    }

    getFile(fileName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const getObjectCommand = new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileName
            });

            client
                .send(getObjectCommand)
                .then((response: GetObjectCommandOutput) => {
                    if (response.Body && response.Body instanceof Readable) {
                        const responseDataChunks: Buffer[] = [];

                        response.Body.once('error', (err) => reject(err));

                        response.Body.on('data', (chunk) => responseDataChunks.push(chunk));

                        response.Body.once('end', () => resolve(Buffer.concat(responseDataChunks).toString()));
                    } else {
                        reject(new Error('Response body is undefined or not a Readable stream'));
                    }
                })
                .catch((err) => {
                    errorManager.report(err, {
                        metadata: {
                            fileName
                        }
                    });
                    reject(err);
                });
        });
    }

    async deleteFiles(fileNames: string[]): Promise<void> {
        if (!isCloud()) {
            return;
        }

        const deleteObjectsCommand = new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
                Objects: fileNames.map((fileName) => ({ Key: fileName }))
            }
        });

        await client.send(deleteObjectsCommand);
    }
}

export default new FileService();

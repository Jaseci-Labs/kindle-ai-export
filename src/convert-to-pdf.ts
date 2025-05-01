import * as fs from 'node:fs';
import path from 'node:path';

import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

export default async function convertPngsToChunkedCompressedPdf(
    inputDir: string,
    outputZipPath: string,
    chunkSize: number
): Promise<void> {
    try {
        if (!fs.existsSync(inputDir)) {
            throw new Error(`Input directory "${inputDir}" does not exist.`);
        }

        const files = fs.readdirSync(inputDir);
        const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');

        if (pngFiles.length === 0) {
            throw new Error('No PNG files found in the input directory.');
        }

        const chunks = [];
        for (let i = 0; i < pngFiles.length; i += chunkSize) {
            chunks.push(pngFiles.slice(i, i + chunkSize));
        }

        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);

        for (const [chunkIndex, chunk] of chunks.entries()) {
            const pdfPath = path.join(inputDir, `chunk-${chunkIndex + 1}.pdf`);
            const pdfDoc = new PDFDocument({ autoFirstPage: false });
            const writeStream = fs.createWriteStream(pdfPath);
            pdfDoc.pipe(writeStream);

            for (const file of chunk) {
                const filePath = path.join(inputDir, file);
                const image = sharp(filePath);
                const metadata = await image.metadata();

                if (!metadata.width || !metadata.height) {
                    throw new Error(`Unable to retrieve dimensions for file: ${file}`);
                }

                const compressedBuffer = await image
                    .jpeg({ quality: 60 })
                    .toBuffer();

                pdfDoc.addPage({ size: [metadata.width, metadata.height] });
                pdfDoc.image(compressedBuffer, 0, 0, {
                    width: metadata.width,
                    height: metadata.height,
                });
            }

            pdfDoc.end();

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            archive.file(pdfPath, { name: `chunk-${chunkIndex + 1}.pdf` });
        }

        await archive.finalize();

        console.log(`Chunked and compressed PDFs created successfully at: ${outputZipPath}`);
    } catch (err) {
        if (err instanceof Error) {
            console.error(`Error: ${err.message}`);
        } else {
            console.error('An unknown error occurred.');
        }
    }
}
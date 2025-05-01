import path from 'node:path'

import convertPngsToChunkedCompressedPdf from "./convert-to-pdf";
import exportBookPdf from "./export-book-pdf";
import exctractKindleBook from "./extract-kindle-book";
import transcribeBook from "./transcribe-book-content";

const main = async (bookAsins: string[]) => {
    for (const asin of bookAsins) {
        // console.log(`Processing book with ASIN: ${asin}`);
        // await exctractKindleBook(asin);
        // console.log(`Extracted kindle book with ASIN: ${asin}`);
        //await transcribeBook(asin);
        //console.log(`Transcribed kindle book with ASIN: ${asin}`);
        convertPngsToChunkedCompressedPdf(path.join('out', asin, 'pages'), path.join('out', asin, 'output.zip'), 10);
        //await exportBookPdf(asin);
        //console.log(`Exported kindle book to pdf with ASIN: ${asin}`);
    }
}

await main(["B01305RWMU"]);
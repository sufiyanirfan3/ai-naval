const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const { PineconeClient } = require("@pinecone-database/pinecone");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { CharacterTextSplitter } = require("langchain/text_splitter");

dotenv.config();

(async () => {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY as string,
    environment: process.env.PINECONE_ENVIRONMENT as string,
  });

  const pineconeIndex = client.Index(process.env.PINECONE_INDEX as string);

  // Specify the directory where your PDF files are located
  const pdfDirectory = "./scripts"; // Update with your directory path

  // Read the files in the directory
  const pdfFiles = fs.readdirSync(pdfDirectory);

  // Process and upload each PDF
  for (const pdfFile of pdfFiles) {
    if (pdfFile.endsWith(".pdf")) {
      const pdfPath = path.join(pdfDirectory, pdfFile);

      const loader = new PDFLoader(pdfPath, {
        splitPages: false,
      });
      const docs = await loader.load();

      const splitter = new CharacterTextSplitter({
        separator: "\n",
        chunkSize: 5000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments(docs);

      await PineconeStore.fromDocuments(splitDocs, new OpenAIEmbeddings(), {
        pineconeIndex,
      });

      console.log(`Uploaded ${pdfFile}`);
    }
  }
})();

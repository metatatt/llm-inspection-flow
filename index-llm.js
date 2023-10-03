// index-llm.js
import { OpenAI } from 'langchain/llms';
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';

//#OpenAI Key
import * as dotenv from 'dotenv';
dotenv.config();

//#doc file path
const folderPath = "./hey_joe_files";  // Assuming all your txt files are in a "texts" folder
const VECTOR_STORE_PATH = `heyjoe.index`;  // Name the vector store based on the whole folder

async function handleLangChainRequest (messageContent) {
  // 5. Initialize the OpenAI model with an empty configuration object
  const model = new OpenAI({});

  // 6. Check if the vector store file exists
  let vectorStore;
  if (fs.existsSync(VECTOR_STORE_PATH)) {
    // 6.1. If the vector store file exists, load it into memory
    console.log('Vector Exists..');
    vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
  } else {
    // 6.2. If the vector store file doesn't exist, create it
    // 6.2.1. Read the input text file
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.txt'));
    // 6.2.2. Read all the files and store their contents in an array
    let allTexts = [];
    for (let file of files) {
        let content = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
        allTexts.push(content);
    }
    // 6.2.3. Create a RecursiveCharacterTextSplitter with a specified chunk size
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    // 6.2.4. Split the input texts into documents
    const docs = await textSplitter.createDocuments(allTexts);  // Process all texts

     // 6.2.5. Create a new vector store from the documents using OpenAIEmbeddings
    vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());

     // 6.2.6. Save the vector store to a file
    await vectorStore.save(VECTOR_STORE_PATH);

  }

  // 7. Create a RetrievalQAChain by passing the initialized OpenAI model and the vector store retriever
  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  // 8. Call the RetrievalQAChain with the input question, and store the result in the 'res' variable
  const question = "How to work on both Adapter Board and a Raspberry Pi? What is the reference documentation id?";

  return new Promise(async (resolve, reject) => {
    try {
        const response = await chain.call({
            query: " "+messageContent,
        });

        if (!response.text) {
            reject(new Error('LangChain response did not return valid text.'));
        }
        resolve(response.text);
    } catch (err) {
        reject(err);
    } 
  });

};

export { handleLangChainRequest };
// index-functions.js
// const { BlobServiceClient } = require("@azure/storage-blob");
// const configJSON = require("./config.json");

import { BlobServiceClient } from "@azure/storage-blob";
import configJSON from './config.json' assert { type: 'json' };

const connectionString = configJSON.blobConnectionString;
const containerName = configJSON.blobContainerName;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);
const sessionTableFile = "sessionTable.json";
let sessionTable = {};


async function getUserGridId (userId){

sessionTable = await downloadSessionTable();

let gridId = "";
for (const key in sessionTable) {
  if (sessionTable[key].userId.slice(0, 5) === userId.slice(0, 5)) {
    gridId = key;
  }
}
console.log('sessiontTable gridId =', gridId)
return gridId
}

async function downloadSessionTable() {
let downloadedTable =""
  try {
        let blobClient = containerClient.getBlobClient(sessionTableFile);
        let downloadedResponse = await blobClient.download();
        let downloadedContent = await streamToString(downloadedResponse.readableStreamBody);
        downloadedTable = JSON.parse(downloadedContent);
        return downloadedTable;
  } catch (error) {
    throw error;
  }
}
// Helper function to convert a ReadableStream to a string
async function streamToString(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk.toString());
  }
  return chunks.join("");
}

export { getUserGridId };

// appwriteClient.js
// Appwrite client configuration for backend
const { Client, Storage, InputFile } = require('node-appwrite');

const client = new Client();
if (process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY) {
    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT) // Your Appwrite endpoint
        .setProject(process.env.APPWRITE_PROJECT_ID) // Your project ID
        .setKey(process.env.APPWRITE_API_KEY); // Your API key (server-side)
}

const storage = new Storage(client);

module.exports = { client, storage, InputFile };

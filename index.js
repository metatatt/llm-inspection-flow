import express from 'express';
const app = express();

import http from 'http';
const server = http.Server(app);

import { Server as SocketIoServer } from 'socket.io';
const io = new SocketIoServer(server);

import bodyParser from 'body-parser';

// Middleware
app.use(bodyParser.json());


// Import modules for different functionalities
import { handleLangChainRequest } from './index-llm.js';
import { agoraCredentials, azureCVCredentials } from './index-agora-azureCV.js';
import { getUserGridId } from './index-functions.js';

// Express routing path variable: __dirname, __filename
import { fileURLToPath } from 'url';
import { dirname } from 'path';

//
const cvKey ="a19a2f3fcf784222a2af267179de9125";
const cvEndpoint = "https://linecam2023-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/f98392ca-b533-4966-b222-d5054dfbe357/detect/iterations/Iteration4/image"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(__dirname + '/public'));

// OpenAI route
app.post('/openai', async (req, res) => {
  const messageContent = req.body.message
  if (!messageContent) {
      return res.status(400).json({ error: "Message is required" });
  }

  try {
      console.log('--')
      console.log('msgContent', messageContent)
      const responseText = await handleLangChainRequest(messageContent);
      console.log('Response:', responseText);
      res.json({text: responseText});
  } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ error: error.message });
  }
});



// Agora route for credentials
app.post('/agoraCredentials', async (req, res) => {
  try {
    // Obtain userId from the request body or wherever it comes from
    const userId = req.body.userId;

    const { agoraToken, agoraAppId, agoraChannel } = await agoraCredentials();
    const gridId = await getUserGridId(userId);

    res.json({
      APP_ID:agoraAppId,
      TOKEN: agoraToken,
      CHANNEL: agoraChannel,
      GRIDID: gridId,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Azure Custom Vision credentials route
app.post('/azureCVCredentials', async (req, res) => {

  try {
    res.json({
      cvEndpoint,
      cvKey,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route for Operator- camera.html
app.get('/', function (req, res) {
  res.sendFile('camera.html', { root: __dirname + '/public' });
});

// Route for Supervisor-Lead - console.html file
app.get('/lead', function (req, res) {
  res.sendFile('console.html', { root: __dirname + '/public' });
});

// Socket.io Configuration
io.on('connection', (socket) => {
  socket.on('query', (userLog) => {
    io.emit('query', userLog);
  });
  socket.on('stationLog', (userLog) => {
    io.emit('stationLog', userLog);
  });

  socket.on('botLog', (userLog) => {
    io.emit('botLog', userLog);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, function () { // Updated this line to use 'server' instead of 'http'
  console.log(`Server listening on port ${port}`);
});

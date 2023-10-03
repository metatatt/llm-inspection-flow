// index-agora-azureCV.js

// const { RtcTokenBuilder, RtcRole } = require('agora-access-token');// Generating Agora access tokens
// const configJSON = require("./config.json");

import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

// Generating Agora access tokens
import configJSON from './config.json' assert { type: 'json' };


async function agoraCredentials() {
  try {
    // Generate Agora token logic here
        const uid = 0;
        const agoraAppId = configJSON.APP_ID;
        const agoraCertificate = configJSON.APP_CERTIFICATE
        const agoraChannel = configJSON.CHANNEL
        const role = RtcRole.PUBLISHER;
        const expireTime = 3600;
    
        const currentTime = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTime + expireTime;
        const agoraToken = RtcTokenBuilder.buildTokenWithUid(agoraAppId, agoraCertificate, agoraChannel, uid, role, privilegeExpireTime);
    return {agoraToken, agoraAppId, agoraChannel}
  } catch (error) {
    throw error;
  }
}

async function azureCVCredentials(cardId) {

  try {

    if (configJSON.hasOwnProperty(cardId)) {
      const cvEndpoint = configJSON[cardId].endConnect;
      const cvKey = configJSON[cardId].keyContain;
      return { cvEndpoint, cvKey };
    } else {
      throw new Error('Invalid cardId'); // Handle the case where cardId is not found in the config
    }
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors and return a response
  }
}


export { agoraCredentials, azureCVCredentials };
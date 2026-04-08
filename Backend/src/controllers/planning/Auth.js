// auth.js (with enhanced debug logging)
const msal = require('@azure/msal-node');

const config = {
  auth: {
    clientId: 'd4531c4f-ffd2-4d4f-b327-075b7272f071',
    authority: 'https://login.microsoftonline.com/c1e5a355-9690-47b4-8d12-00ef54493edb',
    clientSecret: process.env.CLIENT_SECRET
    
  },
};

const cca = new msal.ConfidentialClientApplication(config);

async function getToken() {
  try {
    // console.log('🔑 Attempting to acquire token with config:', {
    //   clientId: config.auth.clientId,
    //   authority: config.auth.authority,
    // });
    
    const result = await cca.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });
    
    // console.log('✅ Token acquired successfully:', {
    //   accessToken: result.accessToken ? '***REDACTED***' : null,
    //   expiresOn: result.expiresOn,
    // });
    
    return result.accessToken;
  } catch (error) {
    console.error('❌ Token acquisition failed:', {
      errorCode: error.errorCode,
      message: error.message,
    });
    throw error;
  }
}

module.exports = { getToken };
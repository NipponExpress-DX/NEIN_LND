// test-auth.js
const { getToken } = require('./Auth');

(async () => {
  try {
    console.log("Starting auth test...");
    const token = await getToken();
    console.log("Token acquired successfully!");
  } catch (error) {
    console.error("Auth failed:", {
      message: error.message,
      errorCode: error.errorCode,
      clientIdUsed: error.config?.auth?.clientId
    });
  }
})();
// Simple test to check if server is running
const http = require('http');

const testServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running! Status: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Server is not running: ${err.message}`);
    console.log('Please start the server with: npm run dev');
  });

  req.end();
};

console.log('Testing server connection...');
testServer();
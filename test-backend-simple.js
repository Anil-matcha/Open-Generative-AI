// Simple backend test
console.log('Testing backend...');

// Test basic Express setup
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const server = app.listen(3002, () => {
  console.log('Test server running on port 3002');
});

setTimeout(() => {
  server.close();
  console.log('Test completed');
}, 2000);
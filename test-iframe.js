import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  // Serve the remix-go app from /apps/remix-go/
  if (req.url.startsWith('/apps/remix-go/')) {
    const filePath = path.join(__dirname, 'public', req.url);
    const ext = path.extname(filePath);

    // Set content type based on file extension
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }

  // Serve the test page
  if (req.url === '/' || req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Remix Go Iframe Test</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  background: #f5f5f5;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              iframe {
                  width: 100%;
                  height: 700px;
                  border: 1px solid #ccc;
                  border-radius: 4px;
              }
              .status {
                  padding: 10px;
                  margin: 10px 0;
                  border-radius: 4px;
              }
              .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
              .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🎬 Remix Go Iframe Test</h1>
              <p>This test verifies that the Remix Go application loads correctly in an iframe.</p>

              <div id="status" class="status">
                  Testing iframe loading...
              </div>

              <h2>Remix Go Application:</h2>
              <iframe
                  id="remix-iframe"
                  src="/apps/remix-go/"
                  onload="updateStatus('success', '✅ Remix Go loaded successfully!')"
                  onerror="updateStatus('error', '❌ Failed to load Remix Go')"
              ></iframe>

              <script>
                  function updateStatus(type, message) {
                      const statusDiv = document.getElementById('status');
                      statusDiv.className = 'status ' + type;
                      statusDiv.textContent = message;
                  }

                  // Timeout check
                  setTimeout(() => {
                      const iframe = document.getElementById('remix-iframe');
                      if (!iframe.contentWindow || !iframe.contentDocument) {
                          updateStatus('error', '❌ Iframe failed to load within 10 seconds');
                      }
                  }, 10000);
              </script>
          </div>
      </body>
      </html>
    `);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🎬 Remix Go Iframe Test Server`);
  console.log(`📱 Open: http://localhost:${PORT}`);
  console.log(`🎯 Test iframe loading at: http://localhost:${PORT}/test`);
  console.log(`📂 Remix Go app served from: /apps/remix-go/`);
});
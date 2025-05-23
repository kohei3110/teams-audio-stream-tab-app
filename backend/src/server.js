/**
 * WebSocket server for receiving audio streams from Teams tab app
 */
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Create output directory for received audio data
const outputDir = path.join(__dirname, '../audio-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const connections = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const userId = new Date().getTime(); // Generate a unique ID (in production, use proper auth)
  const filePath = path.join(outputDir, `audio-${userId}.webm`);
  
  console.info(`New connection established: ${userId}`);
  
  // Create write stream for saving audio data
  const fileStream = fs.createWriteStream(filePath);
  
  // Store connection data
  connections.set(ws, {
    userId,
    filePath,
    stream: fileStream
  });
  
  // Send connection confirmation to client
  ws.send(JSON.stringify({
    type: 'connection',
    userId: userId,
    message: 'Connection established'
  }));
  
  // Handle incoming messages
  ws.on('message', (data) => {
    if (typeof data === 'string') {
      // Handle control messages
      try {
        const controlMessage = JSON.parse(data);
        console.info(`Received control message: ${controlMessage.type} from ${userId}`);
        
        if (controlMessage.type === 'start') {
          ws.send(JSON.stringify({
            type: 'start',
            status: 'ok',
            message: 'Started recording'
          }));
        } else if (controlMessage.type === 'stop') {
          ws.send(JSON.stringify({
            type: 'stop',
            status: 'ok',
            message: 'Stopped recording'
          }));
          
          // Close the file stream
          const connData = connections.get(ws);
          if (connData && connData.stream) {
            connData.stream.end();
            console.info(`Audio data saved to: ${connData.filePath}`);
          }
        }
      } catch (error) {
        console.error('Error processing control message', error);
      }      } else {
        // Handle binary audio data
        const connData = connections.get(ws);
        if (connData && connData.stream) {
          try {
            // Write the binary data to the file stream
            const writeSuccess = connData.stream.write(data);
            
            if (!writeSuccess) {
              // If write returns false, the stream's buffer is full
              // We should wait for the 'drain' event before sending more data
              console.warn(`Buffer full for connection ${connData.userId}, waiting for drain`);
              
              // We could implement backpressure handling here
              // For simplicity, we'll still acknowledge receipt
            }
            
            // Acknowledge receipt of audio chunk
            ws.send(JSON.stringify({
              type: 'audioChunk',
              status: 'received',
              timestamp: new Date().getTime()
            }));
          } catch (error) {
            console.error(`Error writing audio data for ${connData.userId}:`, error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Error processing audio data'
            }));
          }
        }
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    const connData = connections.get(ws);
    if (connData) {
      console.info(`Connection closed: ${connData.userId}`);
      if (connData.stream) {
        connData.stream.end();
      }
      connections.delete(ws);
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error.message}`);
    const connData = connections.get(ws);
    if (connData && connData.stream) {
      connData.stream.end();
    }
    connections.delete(ws);
  });
});

// REST endpoint for testing
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Audio streaming server is running',
    connections: connections.size
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  console.info(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.info(`Audio files will be saved to: ${outputDir}`);
});

module.exports = server; // Export for testing

const express = require('express');
const expressWs = require('express-ws');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
expressWs(app);

const port = process.env.PORT || 3001;
const connects = [];

// PostgreSQLの接続プールを作成
const pool = new Pool({
  host: 'localhost',
  database: 'test',
  user: 'kishi',
  password: 'kishi1021',
  port: 5432,
});

app.use(express.static('public'));

app.ws('/ws', (ws, req) => {
  connects.push(ws);

  ws.on('message', async (message) => {
    console.log('Received:', message);

    const [senderId, messageText] = message.split(':');
    const timestamp = new Date();

    // メッセージをPostgreSQLに保存
    const query = 'INSERT INTO messages (sender_id, message_text, timestamp) VALUES ($1, $2, $3)';
    await pool.query(query, [senderId, messageText, timestamp]);

    connects.forEach((socket) => {
      if (socket.readyState === 1) {
        // Check if the connection is open
        socket.send(message);
      }
    });
  });

  ws.on('close', () => {
    connects = connects.filter((conn) => conn !== ws);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

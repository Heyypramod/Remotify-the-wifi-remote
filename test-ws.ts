import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:3000/api/ws');
ws.on('open', () => {
  console.log('Connected!');
  ws.close();
});
ws.on('error', (e) => console.error('WS Error:', e.message));

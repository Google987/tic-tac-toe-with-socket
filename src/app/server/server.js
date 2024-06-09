// server.js
const { io } = require('./socketInstance');

const PORT = 3001;
io.listen(PORT, () => {
    console.log(`WebSocket server listening on port ${PORT}`);
});

// socketInstance.js

const http = require('http');
const io = require('socket.io')({
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const gameRooms = {};  // To store users by game room

io.on('connection', (socket) => {
    console.log('A user connected');

    // User creates a game
    socket.on('createGame', () => {
        const gameNumber = generateUniqueGameNumber();
        socket.join(gameNumber);
        gameRooms[gameNumber] = [socket.id];
        socket.emit('gameCreated', { gameNumber });
        console.log(`Game created with number: ${gameNumber}`);
    });

    // User joins an existing game
    socket.on('joinGame', (gameNumber) => {
        if (gameRooms[gameNumber]) {
            socket.join(gameNumber);
            if (gameRooms[gameNumber].length == 2)
                socket.emit('error', 'Game is already full');
            else {
                gameRooms[gameNumber].push(socket.id);
                socket.emit('gameJoined', { gameNumber });
                io.to(gameNumber).emit('userJoined', { userId: socket.id });
                console.log(`User joined game number: ${gameNumber}`);
            }
        } else {
            socket.emit('error', 'Invalid game number');
        }
    });

    // Handle game moves
    socket.on('move', (data) => {
        const { gameNumber, index, symbol } = data;
        if (gameRooms[gameNumber]) {
            io.to(gameNumber).emit('move', data);
            console.log(`Move in game ${gameNumber}: ${index} ${symbol}`);
        } else {
            socket.emit('error', 'Invalid game number');
        }
    });

    socket.on('resetGame', (gameNumber) => {
        if (gameRooms[gameNumber]) {
            io.to(gameNumber).emit('resetGame');
            console.log(`Reset game number: ${gameNumber}`);
        } else {
            socket.emit('error', 'Invalid game number x');
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        for (const gameNumber in gameRooms) {
            const index = gameRooms[gameNumber].indexOf(socket.id);
            if (index !== -1) {
                gameRooms[gameNumber].splice(index, 1);
                if (gameRooms[gameNumber].length === 0) {
                    delete gameRooms[gameNumber];
                }
                io.to(gameNumber).emit('userDisconnected', { userId: socket.id });
                break;
            }
        }
        console.log('A user disconnected');
    });
});

// Function to generate a unique game number
function generateUniqueGameNumber() {
    return Math.random().toString(36).substring(2, 9);  // Simple unique string
}

module.exports = { io };

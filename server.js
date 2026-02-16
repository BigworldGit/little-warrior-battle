const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game rooms
const rooms = new Map();

// Player waiting for match
let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create or join a game room
    socket.on('joinGame', (playerName) => {
        socket.playerName = playerName || `Player ${socket.id.slice(0, 4)}`;
        
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // Match found!
            const roomId = `room_${waitingPlayer.id}_${socket.id}`;
            const room = {
                id: roomId,
                players: [
                    { id: waitingPlayer.id, name: waitingPlayer.playerName, socket: waitingPlayer, playerNum: 1 },
                    { id: socket.id, name: socket.playerName, socket: socket, playerNum: 2 }
                ],
                gameState: null
            };
            rooms.set(roomId, room);
            
            // Join both to room
            waitingPlayer.join(roomId);
            socket.join(roomId);
            
            // Notify both players
            io.to(waitingPlayer.id).emit('gameStart', {
                roomId,
                playerNum: 1,
                opponentName: socket.playerName
            });
            io.to(socket.id).emit('gameStart', {
                roomId,
                playerNum: 2,
                opponentName: waitingPlayer.playerName
            });
            
            console.log(`Game started: ${roomId} - ${waitingPlayer.playerName} vs ${socket.playerName}`);
            waitingPlayer = null;
        } else {
            // Wait for opponent
            waitingPlayer = socket;
            socket.emit('waiting', { message: '等待对手加入...' });
            console.log(`${socket.playerName} is waiting for opponent`);
        }
    });

    // Handle game actions
    socket.on('gameAction', (data) => {
        const { roomId, action } = data;
        const room = rooms.get(roomId);
        
        if (room) {
            // Broadcast action to opponent
            const opponent = room.players.find(p => p.id !== socket.id);
            if (opponent) {
                io.to(opponent.id).emit('opponentAction', action);
            }
        }
    });

    // Handle game state sync (for reconnection or initial sync)
    socket.on('syncState', (data) => {
        const { roomId, gameState } = data;
        const room = rooms.get(roomId);
        
        if (room) {
            room.gameState = gameState;
            // Broadcast to opponent
            const opponent = room.players.find(p => p.id !== socket.id);
            if (opponent) {
                io.to(opponent.id).emit('syncState', gameState);
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // If was waiting, clear
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        
        // Find and notify room
        rooms.forEach((room, roomId) => {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                const opponent = room.players.find(p => p.id !== socket.id);
                if (opponent) {
                    io.to(opponent.id).emit('opponentLeft', { 
                        message: `${player.name} 离开了游戏` 
                    });
                }
                rooms.delete(roomId);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

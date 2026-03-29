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
let waitingPlayer = null;

// Rate limiting
const rateLimits = new Map();
const RATE_LIMIT = 60; // max messages per second

function checkRateLimit(socketId) {
    const now = Date.now();
    const data = rateLimits.get(socketId) || { count: 0, resetTime: now + 1000 };
    if (now > data.resetTime) {
        data.count = 0;
        data.resetTime = now + 1000;
    }
    data.count++;
    rateLimits.set(socketId, data);
    return data.count <= RATE_LIMIT;
}

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('joinGame', (playerName) => {
        if (typeof playerName !== 'string') playerName = '';
        socket.playerName = playerName.slice(0, 12) || `Player ${socket.id.slice(0, 4)}`;

        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = `room_${waitingPlayer.id}_${socket.id}`;
            const room = {
                id: roomId,
                players: [
                    { id: waitingPlayer.id, name: waitingPlayer.playerName, socket: waitingPlayer, playerNum: 1 },
                    { id: socket.id, name: socket.playerName, socket: socket, playerNum: 2 }
                ],
                gameState: null,
                createdAt: Date.now()
            };
            rooms.set(roomId, room);

            waitingPlayer.join(roomId);
            socket.join(roomId);

            io.to(waitingPlayer.id).emit('gameStart', {
                roomId, playerNum: 1, opponentName: socket.playerName
            });
            io.to(socket.id).emit('gameStart', {
                roomId, playerNum: 2, opponentName: waitingPlayer.playerName
            });

            console.log(`Game started: ${roomId} - ${waitingPlayer.playerName} vs ${socket.playerName}`);
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', { message: '等待对手加入...' });
            console.log(`${socket.playerName} is waiting for opponent`);
        }
    });

    socket.on('gameAction', (data) => {
        if (!checkRateLimit(socket.id)) return;
        const { roomId, action } = data;
        if (!roomId || !action || typeof action !== 'object') return;
        const room = rooms.get(roomId);
        if (room) {
            // Validate hit damage server-side
            if (action.type === 'hit') {
                const maxDamage = 60;
                action.damage = Math.min(Math.max(0, Number(action.damage) || 0), maxDamage);
            }
            const opponent = room.players.find(p => p.id !== socket.id);
            if (opponent) {
                io.to(opponent.id).emit('opponentAction', action);
            }
        }
    });

    socket.on('syncState', (data) => {
        if (!checkRateLimit(socket.id)) return;
        const { roomId, gameState } = data;
        const room = rooms.get(roomId);
        if (room) {
            room.gameState = gameState;
            const opponent = room.players.find(p => p.id !== socket.id);
            if (opponent) {
                io.to(opponent.id).emit('syncState', gameState);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        rateLimits.delete(socket.id);

        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }

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

// Clean up stale rooms every 5 minutes
setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, roomId) => {
        if (now - room.createdAt > 30 * 60 * 1000) {
            rooms.delete(roomId);
        }
    });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

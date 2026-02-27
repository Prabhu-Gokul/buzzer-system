const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// State Management
let state = {
    isLocked: true,
    participants: {}, // socketId -> { name, score, connected }
    buzzers: [],      // Array of { name, socketId, timestamp }
    roundHistory: []  // List of completed rounds
};

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Initial state sync
    socket.emit('stateUpdate', {
        isLocked: state.isLocked,
        buzzers: state.buzzers,
        participantCount: Object.values(state.participants).filter(p => p.connected).length
    });

    socket.on('join', (name) => {
        state.participants[socket.id] = {
            name: name,
            score: state.participants[socket.id]?.score || 0,
            connected: true
        };
        io.emit('participantUpdate', getActiveParticipants());
        console.log(`${name} joined.`);
    });

    socket.on('buzz', () => {
        if (state.isLocked) return;

        const participant = state.participants[socket.id];
        if (!participant) return;

        // Check if already buzzed this round
        const alreadyBuzzed = state.buzzers.find(b => b.socketId === socket.id);
        if (alreadyBuzzed) return;

        // Atomic capture (Allow all until manual lock)
        const buzzEntry = {
            name: participant.name,
            socketId: socket.id,
            timestamp: Date.now()
        };
        state.buzzers.push(buzzEntry);

        io.emit('buzzReceived', state.buzzers);
        console.log(`${participant.name} buzzed at position ${state.buzzers.length}`);
    });

    // Admin Controls
    socket.on('admin_start', () => {
        state.isLocked = false;
        state.buzzers = [];
        io.emit('roundStarted');
        io.emit('lockStatus', false);
        console.log('Round Started');
    });

    socket.on('admin_reset', () => {
        state.isLocked = true;
        state.buzzers = [];
        io.emit('roundReset');
        io.emit('lockStatus', true);
        console.log('Round Reset');
    });

    socket.on('admin_awardPoints', ({ socketId, points }) => {
        if (state.participants[socketId]) {
            state.participants[socketId].score += points;
            // Record to history if it's the first time awarding points for this round's buzzers
            io.emit('participantUpdate', getActiveParticipants());
        }
    });

    socket.on('admin_logRound', (data) => {
        state.roundHistory.push({
            timestamp: new Date().toLocaleTimeString(),
            winners: state.buzzers.map(b => b.name),
            data: data // Can store question info etc
        });
        io.emit('historyUpdate', state.roundHistory);
    });

    socket.on('disconnect', () => {
        if (state.participants[socket.id]) {
            state.participants[socket.id].connected = false;
            io.emit('participantUpdate', getActiveParticipants());
        }
        console.log('User disconnected:', socket.id);
    });
});

function getActiveParticipants() {
    return Object.entries(state.participants)
        .filter(([id, p]) => p.connected)
        .map(([id, p]) => ({ id, name: p.name, score: p.score }));
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static("public"));

const users = {};
const SECRET_KEY = "your_secure_secret_key_here"; // In production, use environment variable

function generateToken(userId) {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return null;
    }
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (username) => {
        const token = generateToken(socket.id);
        users[socket.id] = {
            username: username || `User-${socket.id.substr(0, 4)}`,
            id: socket.id,
            videoEnabled: true,
            audioEnabled: true,
            token
        };
        
        socket.emit("authentication", { token });
        io.emit("user-list", Object.values(users).map(u => ({
            id: u.id,
            username: u.username,
            videoEnabled: u.videoEnabled,
            audioEnabled: u.audioEnabled
        })));
    });

    socket.on("media-status-change", (data) => {
        if (users[socket.id]) {
            users[socket.id].videoEnabled = data.videoEnabled;
            users[socket.id].audioEnabled = data.audioEnabled;

            if (data.peerId) {
                io.to(data.peerId).emit("peer-media-status", {
                    videoEnabled: data.videoEnabled,
                    audioEnabled: data.audioEnabled
                });
            }

            io.emit("user-list", Object.values(users).map(u => ({
                id: u.id,
                username: u.username,
                videoEnabled: u.videoEnabled,
                audioEnabled: u.audioEnabled
            })));
        }
    });

    socket.on("signal", (data) => {
        if (!users[socket.id]) return;
        
        const targetSocket = users[data.target]?.id;
        if (targetSocket) {
            io.to(targetSocket).emit("signal", {
                sender: socket.id,
                signal: data.signal
            });
        }
    });

    socket.on("call-request", (data) => {
        if (!users[socket.id]) return;
        
        const targetSocket = users[data.target]?.id;
        if (targetSocket) {
            io.to(targetSocket).emit("incoming-call", {
                caller: socket.id,
                callerName: users[socket.id].username
            });
        }
    });

    socket.on("call-response", (data) => {
        if (!users[socket.id]) return;
        
        const targetSocket = users[data.target]?.id;
        if (targetSocket) {
            io.to(targetSocket).emit("call-response", {
                accepted: data.accepted,
                responder: socket.id,
                responderName: users[socket.id].username
            });
        }
    });

    socket.on("end-call", (data) => {
        if (!users[socket.id]) return;
        
        const targetSocket = users[data.target]?.id;
        if (targetSocket) {
            io.to(targetSocket).emit("call-ended", { peerId: socket.id });
        }
    });

    socket.on("chat-message", (data) => {
        if (!users[socket.id]) return;
        
        const targetSocket = users[data.target]?.id;
        if (targetSocket) {
            io.to(targetSocket).emit("chat-message", {
                sender: socket.id,
                senderName: users[socket.id].username,
                message: data.message
            });
        }
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("user-list", Object.values(users).map(u => ({
            id: u.id,
            username: u.username,
            videoEnabled: u.videoEnabled,
            audioEnabled: u.audioEnabled
        })));
        io.emit("user-disconnected", socket.id);
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
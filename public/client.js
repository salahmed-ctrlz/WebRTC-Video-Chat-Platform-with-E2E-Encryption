const socket = io();

// DOM Elements
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const toggleCameraBtn = document.getElementById("toggleCamera");
const switchCameraBtn = document.getElementById("switchCamera");
const toggleMicBtn = document.getElementById("toggleMic");
const endCallBtn = document.getElementById("endCall");
const userList = document.getElementById("userList");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendMessageBtn = document.getElementById("sendMessage");
const remoteMediaStatus = document.getElementById("remoteMediaStatus");
const remoteVideoStatus = document.getElementById("remoteVideoStatus");
const remoteAudioStatus = document.getElementById("remoteAudioStatus");
const localVideoTitle = document.getElementById("localVideoTitle");
const remoteVideoTitle = document.getElementById("remoteVideoTitle");
const chooseUsernameBtn = document.getElementById("chooseUsername");

// State variables
let localStream;
let peerConnection;
let targetUserId = null;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isInCall = false;
let currentCameraIndex = 0;
let availableCameras = [];
let authToken = null;
let username = "";

// Choose username
chooseUsernameBtn.onclick = () => {
    const newUsername = prompt("Please enter your username:") || `User-${Math.floor(Math.random() * 1000)}`;
    if (newUsername) {
        username = newUsername;
        localVideoTitle.textContent = username;
        socket.emit("join", username);
        chooseUsernameBtn.style.display = "none";
    }
};

// Initialize WebRTC
async function setupMediaStream() {
    try {
        availableCameras = await getAvailableCameras();
        switchCameraBtn.style.display = availableCameras.length > 1 ? "block" : "none";

        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        localVideo.srcObject = localStream;
        localVideo.style.transform = "scaleX(-1)"; // Mirror the local video
        setupMediaControls();
    } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Failed to access camera and microphone");
    }
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === "videoinput");
    } catch (err) {
        console.error("Error getting cameras:", err);
        return [];
    }
}

async function createPeerConnection() {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = ({ streams: [stream] }) => {
        remoteVideo.srcObject = stream;
        remoteMediaStatus.style.display = "flex";
    };

    pc.onicecandidate = ({ candidate }) => {
        if (candidate && targetUserId) {
            socket.emit("signal", {
                target: targetUserId,
                signal: { candidate }
            });
        }
    };

    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected") {
            endCall();
        }
    };

    return pc;
}

function setupMediaControls() {
    toggleCameraBtn.onclick = () => {
        isVideoEnabled = !isVideoEnabled;
        localStream.getVideoTracks()[0].enabled = isVideoEnabled;
        toggleCameraBtn.innerHTML = `<i class="fas fa-video${isVideoEnabled ? "" : "-slash"}"></i> Camera ${isVideoEnabled ? "On" : "Off"}`;
        toggleCameraBtn.classList.toggle("off", !isVideoEnabled);
        
        if (targetUserId) {
            socket.emit("media-status-change", {
                videoEnabled: isVideoEnabled,
                audioEnabled: isAudioEnabled,
                peerId: targetUserId
            });
        }
    };

    switchCameraBtn.onclick = async () => {
        if (availableCameras.length < 2) return;
        
        currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
        const newCamera = availableCameras[currentCameraIndex];
        
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: newCamera.deviceId } },
            audio: true
        });

        localStream.getVideoTracks().forEach(track => track.stop());
        localStream = newStream;
        localVideo.srcObject = newStream;
        localVideo.style.transform = "scaleX(-1)"; // Mirror the local video

        if (peerConnection) {
            const sender = peerConnection.getSenders().find(s => s.track?.kind === "video");
            if (sender) {
                await sender.replaceTrack(newStream.getVideoTracks()[0]);
            }
        }
    };

    toggleMicBtn.onclick = () => {
        isAudioEnabled = !isAudioEnabled;
        localStream.getAudioTracks()[0].enabled = isAudioEnabled;
        toggleMicBtn.innerHTML = `<i class="fas fa-microphone${isAudioEnabled ? "" : "-slash"}"></i> Mic ${isAudioEnabled ? "On" : "Off"}`;
        toggleMicBtn.classList.toggle("off", !isAudioEnabled);
        
        if (targetUserId) {
            socket.emit("media-status-change", {
                videoEnabled: isVideoEnabled,
                audioEnabled: isAudioEnabled,
                peerId: targetUserId
            });
        }
    };

    endCallBtn.onclick = () => {
        if (targetUserId) {
            socket.emit("end-call", { target: targetUserId });
            endCall();
        }
    };

    chatInput.onkeypress = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    sendMessageBtn.onclick = sendMessage;
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message && targetUserId) {
        socket.emit("chat-message", {
            target: targetUserId,
            message
        });
        appendMessage(`You: ${message}`, true);
        chatInput.value = "";
    }
}

function updateUserList(users) {
    const listContent = document.createElement("div");
    listContent.innerHTML = "<h3>Connected Users</h3>";

    users.forEach(user => {
        if (user.id !== socket.id) {
            const userElement = document.createElement("div");
            userElement.className = "user-item";
            userElement.innerHTML = `
                <span>${user.username}</span>
                <button onclick="initiateCall('${user.id}')" class="call-button" ${isInCall ? "disabled" : ""}>
                    <i class="fas fa-phone"></i> Call
                </button>
            `;
            listContent.appendChild(userElement);
        }
    });

    userList.innerHTML = "";
    userList.appendChild(listContent);
}

function appendMessage(message, isLocal = false) {
    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    messageElement.classList.add(isLocal ? "local-message" : "remote-message");
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function initiateCall(userId) {
    if (isInCall) return;
    
    targetUserId = userId;
    socket.emit("call-request", {
        target: userId
    });
}

function showCallNotification(callerId, callerName) {
    removeCallNotification();
    
    const notification = document.createElement("div");
    notification.className = "call-notification";
    notification.id = "callNotification";
    notification.innerHTML = `
        <p>Incoming call from ${callerName}</p>
        <div class="call-actions">
            <button onclick="acceptCall('${callerId}')" class="accept-call">
                <i class="fas fa-phone"></i> Accept
            </button>
            <button onclick="rejectCall('${callerId}')" class="reject-call">
                <i class="fas fa-phone-slash"></i> Decline
            </button>
        </div>
    `;
    document.body.appendChild(notification);
}

function removeCallNotification() {
    const existingNotification = document.getElementById("callNotification");
    if (existingNotification) {
        existingNotification.remove();
    }
}

async function acceptCall(callerId) {
    targetUserId = callerId;
    isInCall = true;
    
    try {
        peerConnection = await createPeerConnection();
        endCallBtn.style.display = "block";
        
        socket.emit("call-response", {
            target: callerId,
            accepted: true
        });

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit("signal", {
            target: callerId,
            signal: { sdp: peerConnection.localDescription }
        });
    } catch (err) {
        console.error("Error accepting call:", err);
        endCall();
    }
    removeCallNotification();
}

function rejectCall(callerId) {
    socket.emit("call-response", {
        target: callerId,
        accepted: false
    });
    removeCallNotification();
}

function endCall() {
    isInCall = false;
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    targetUserId = null;
    remoteVideo.srcObject = null;
    endCallBtn.style.display = "none";
    remoteMediaStatus.style.display = "none";
    remoteVideoTitle.textContent = "Other";
}

// Socket event handlers
socket.on("authentication", ({ token }) => {
    authToken = token;
});

socket.on("user-list", updateUserList);

socket.on("incoming-call", ({ caller, callerName }) => {
    if (!isInCall) {
        showCallNotification(caller, callerName);
    }
});

socket.on("call-response", async ({ accepted, responder, responderName }) => {
    if (accepted) {
        isInCall = true;
        peerConnection = await createPeerConnection();
        endCallBtn.style.display = "block";
        remoteVideoTitle.textContent = responderName;
    } else {
        endCall();
        alert("Call was rejected");
    }
});

socket.on("call-ended", () => {
    endCall();
    alert("Call ended");
});

socket.on("peer-media-status", ({ videoEnabled, audioEnabled }) => {
    remoteVideoStatus.classList.toggle("off", !videoEnabled);
    remoteAudioStatus.classList.toggle("off", !audioEnabled);
});

socket.on("chat-message", ({ senderName, message }) => {
    appendMessage(`${senderName}: ${message}`);
});

socket.on("signal", async (data) => {
    if (!peerConnection) {
        peerConnection = await createPeerConnection();
    }

    if (data.signal.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        
        if (data.signal.sdp.type === "offer") {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socket.emit("signal", {
                target: data.sender,
                signal: { sdp: peerConnection.localDescription }
            });
        }
    } else if (data.signal.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
    }
});

socket.on("user-disconnected", (userId) => {
    if (userId === targetUserId) {
        endCall();
    }
});

// Start the application
setupMediaStream();
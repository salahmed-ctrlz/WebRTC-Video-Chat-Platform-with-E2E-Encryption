# WebRTC Video Chat Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build Status](https://github.com/yourusername/webrtc-video-chat/actions/workflows/node.js.yml/badge.svg)](https://github.com/yourusername/webrtc-video-chat/actions)

A secure video chat application built with WebRTC that supports both one-to-one and room-based private calls. This project demonstrates secure signaling, end-to-end encryption, and dynamic room management using modern web technologies.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Using Ngrok](#using-ngrok)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Secure Video Calls:** Utilizes WebRTC for real-time communication.
- **End-to-End Encryption:** Implements secure signaling using JSON Web Tokens (JWT) and ECDH key exchange.
- **User-Friendly Interface:** Intuitive controls for toggling video/audio and managing calls.
- **Scalable Architecture:** Easily extendable to support additional features.

---

## Prerequisites

Before you begin, ensure that you have the following installed on your system:

- **[Node.js](https://nodejs.org/)** (v12 or later)
- **npm** (Node.js package manager; comes with Node.js)
- A modern web browser (Chrome, Firefox, etc.)

---

## Installation

This repository contains the core files for the application. Follow these steps to install the required dependencies:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/webrtc-video-chat.git
   cd webrtc-video-chat

2. **Install Server-Side Dependencies**

   Install the necessary Node.js modules defined in `package.json`:

   ```bash
   npm install
   ```

3. **Client-Side Libraries**

   Ensure any additional client-side libraries (e.g., for WebRTC support or UI enhancements) are included either via CDN links in your HTML files or placed within the `public` directory.

---

## Running the Application

After installing the dependencies, start the application using:

```bash
npm start
```

By default, the server will run on port `3000`. You should see output similar to:

```
Server running on port 3000...
```

Open your browser and navigate to `http://localhost:3000` to access the app.

---

## Using Ngrok

Ngrok allows you to expose your local server to the internet, making it easy to test your application from remote devices or share it with others.

1. **Download and Install Ngrok**

   - Visit [ngrok.com](https://ngrok.com/), sign up if necessary, and download the appropriate version for your operating system.
   - Unzip the package and move the `ngrok` executable to a directory in your system's PATH.

2. **Start Ngrok**

   With your application running locally on port 3000, open a new terminal window and run:

   ```bash
   ngrok http 3000
   ```

3. **Access the Public URL**

   Ngrok will display a forwarding URL (e.g., `https://abc123.ngrok.io`). Use this URL to access your WebRTC Video Chat Platform over the internet or share it with testers.

---

## Usage

### Creating or Joining a Room

1. **Open the Application:**
   - Navigate to your local URL or the Ngrok URL in your web browser.

2. **Create/Join a Room:**
   - To **create** a room, click the "Create Room" button; a unique room ID will be generated.
   - To **join** a room, enter an existing room ID in the provided field and click "Join Room".

3. **Start Video Chat:**
   - Use the on-screen controls to toggle your camera and microphone.
   - The application will automatically handle peer connections and secure signaling for your call.

---

## Project Structure

```plaintext
webrtc-video-chat/
├── public/                 # Client-side static assets (HTML, CSS, JS)
├── server.js               # Main server file (Node.js + Express)
├── package.json            # npm configuration with dependencies and scripts
└── README.md               # This file
```

---

## Contributing

Contributions are welcome! To contribute:

1. **Fork the Repository**
2. **Create a New Branch** for your feature or bug fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Your Changes** and push the branch:

   ```bash
   git commit -m "Describe your changes"
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** explaining your changes.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Happy coding!
```

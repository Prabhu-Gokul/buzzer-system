# Production-Ready Buzzer System

A high-performance, real-time buzzer system designed for college events.

## Features
- **Dual Capture:** Automatically records only the first and second buzzer presses.
- **Auto-Lock:** System locks after the second buzzer to prevent late entries.
- **Mobile Optimized:** Large touch-friendly buzzer button with haptic-simulated visual feedback.
- **Admin Dashboard:** Control rounds, track participants, award scores, and view history.
- **Score Tracking:** Built-in leaderboard with manual point adjustments.

## Setup Instructions

### Local Machine
1. Ensure Node.js (v16+) is installed.
2. Navigate to the project folder:
   ```bash
   cd buzzer-system
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. Open browser:
   - **Participants:** `http://localhost:3000`
   - **Admin:** `http://localhost:3000/admin`

### Docker Deployment
```bash
docker build -t buzzer-system .
docker run -p 3000:3000 buzzer-system
```

## Game Logic
1. Admin clicks **START ROUND**.
2. Participant screens turn "READY" and the buzzer becomes active.
3. Once 2 participants buzz:
   - The server captures their timestamps.
   - The system locks immediately.
   - Admin sees #1 and #2 positions on the dashboard.
4. Admin can award points and click **RESET ALL** for the next question.

# App Overview
What's your purpose? is a web app that helps you discover your purpose in life. The app asks you a series of questions and then uses the answers to generate a personalized purpose statement. It is a tool for self-discovery and personal growth, to maintain alignment with decisions you make in your life.

## Core Features

### User Management
- Anonymous authentication using device fingerprinting
- Username-based account system
- Account recovery system with security questions
- JWT-based authentication with refresh token mechanism
- additional admin user for maintenance

### Purpose Tracking
- Record daily purpose statements
- View other purpose statements

### Social Features
- Share your purpose statement with friends
- View and comment on other users' purpose statements
- Real Time user count of participants
- Community Stats

### Admin Dashboard
- View all users
- View all purpose statements
- View all comments
- Delete any user, purpose statement, or comment

### UI/UX
- Responsive design for mobile, tablet, and desktop
- Minimalistic design with a focus on content
- Dark/light theme toggle

## Technical Requirements

### Frontend
- Pure JavaScript (Vanilla JS) for client-side logic
- CSS for styling with CSS Grid for layout
- Local storage for auth tokens and preferences

### Backend
- Vercel serverless functions for API endpoints
- KV storage for data persistence
- JWT-based authentication system

### API Endpoints
1. Authentication
   - `/api/auth/token-verify` - Verify JWT token
   - `/api/auth/token-refresh` - Refresh access token
   - `/api/check-username` - Check username availability

2. Core Functionality
   - `/api/record-answers` - Record answers
   - `/api/ws` - WebSocket endpoint for real-time updates

3. Admin
   - `/api/admin/auth` - Admin authentication
   - `/api/admin/cleanup` - Data maintenance

### Data Models

#### User
```json
{
  "userId": "string",
  "username": "string",
  "deviceId": "string",
  "recoveryAnswer": "string (hashed)",
  "createdAt": "timestamp"
}
```

#### User Response
```json
{
  "userId": "string",
  "values": "string[]",
  "strengths": "string[]",
  "question1": "string",
  "question2": "string",
  "question3": "string",
  "question4": "string",
  "humanNeeds": "string[]",
  "createdAt": "timestamp"
}
```

#### Purpose Statement
```json
{
  "userId": "string",
  "purpose": "string",
  "createdAt": "timestamp"
}
```
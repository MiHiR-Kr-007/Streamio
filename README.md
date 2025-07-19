# Streamio

Streamio is a full-featured video streaming platform with integrated tweet-like social features. Users can upload, watch, and interact with videos, as well as post tweets, create playlists, comment, like, and subscribe to channels. This project is built with a modern React frontend and a robust Node.js/Express backend.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 🎬 Video Streaming
- Upload, watch, and manage videos (with thumbnails, duration, and view count)
- Video player with fullscreen, volume, and playback controls
- Video detail pages with comments, likes, and playlist options
- Video editing and deletion (for owners)
- Watch history tracking

### 📝 Tweet Functionality
- Post tweet-like messages ("tweets")
- View all tweets or user-specific tweets
- Like tweets and see like counts
- Social feed for sharing thoughts with subscribers

### 📺 Playlists
- Create, edit, and delete playlists
- Add or remove videos from playlists
- View playlist details and play all videos in a playlist

### 💬 Comments & Likes
- Comment on videos
- Like/unlike videos, comments, and tweets
- See like counts and who liked your content

### 👤 User Accounts & Profiles
- Register, login, and logout securely
- User profile with avatar, cover image, and bio
- View other users' profiles and their videos
- Update account details and profile images

### 🔔 Subscriptions
- Subscribe/unsubscribe to channels (users)
- See subscriber counts on profiles and videos
- Get notified of new uploads from subscribed channels

### 📊 Dashboard
- Personalized dashboard with stats (videos, views, likes, subscribers)
- Quick access to your uploads, tweets, playlists, and watch history

### 🔒 Authentication & Security
- JWT-based authentication (secure routes)
- Password hashing with bcrypt
- Protected routes for uploads, tweets, and account management

---

## Tech Stack

### Frontend
- **React 19** (with Hooks & functional components)
- **Redux Toolkit** for state management
- **React Router v7** for routing
- **Tailwind CSS** for styling
- **Axios** for API requests
- **Vite** for fast development

### Backend
- **Node.js** & **Express 5**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **Cloudinary** for media storage
- **Multer** for file uploads
- **Bcrypt** for password security
- **CORS**, **dotenv**, and more

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Cloudinary account (for media storage)

### 1. Clone the Repository
```bash
git clone https://github.com/MiHiR-Kr-007/streamio.git
cd streamio
```

### 2. Setup Backend
```bash
cd backend
npm install
# Copy .env.example to .env and update with your credentials
cp .env.example .env
# Edit .env with your MongoDB URI, Cloudinary credentials, and JWT secrets
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
# Copy .env.example to .env and update API URL if needed
cp .env.example .env
npm run dev
```

### 4. Open in Browser
Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal)

---

## Project Structure

```
streamio/
├── backend/      # Express API, MongoDB models, controllers, routes
├── frontend/     # React app, components, Redux, styles
└── README.md     # Project documentation
```

---

## API Overview

- **Auth:** Register, login, logout, get current user
- **Videos:** CRUD, view count, like, comment, add to playlist
- **Tweets:** CRUD, like, user tweets
- **Playlists:** CRUD, add/remove videos
- **Comments:** CRUD, like
- **Likes:** Like/unlike videos, comments, tweets
- **Subscriptions:** Subscribe/unsubscribe, get subscribers
- **Dashboard:** User stats, watch history

API endpoints are versioned under `/api/v1/`.

---

## Contributing

Contributions are welcome! Please open issues or pull requests for improvements, bug fixes, or new features.

---

## License

This project is licensed under the ISC License. 
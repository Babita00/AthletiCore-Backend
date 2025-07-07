// server.ts
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import userRoutes from './routes/user.router';
import eventRoutes from './routes/event.router';
import eventFormRoutes from './routes/eventForm.router';
import announcementRoutes from './routes/announcement.router';
import attemptRoutes from './routes/liftAttempt.router';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();

// List of allowed origins for CORS
const allowedOrigins = ['http://localhost:8081', 'http://192.168.254.36:8081'];

// CORS middleware configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Middleware

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/form-events', eventFormRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/attempt', attemptRoutes);

import liveScoreboardRoutes from './routes/liveScoreboard.routes';
app.use('/api/live-scoreboard', liveScoreboardRoutes);

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

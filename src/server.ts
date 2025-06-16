//----- 7. server.ts -----
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import userRoutes from './routes/user.router';
import eventRoutes from './routes/event.router';
import eventFormROutes from './routes/eventForm.router';
import cookieParser from 'cookie-parser';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/form-events', eventFormROutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

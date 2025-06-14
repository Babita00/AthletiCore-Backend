import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT;
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

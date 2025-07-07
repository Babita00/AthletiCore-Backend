import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerProfile extends Document {
  user: mongoose.Types.ObjectId;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  joinedAt?: Date;
  isPremium?: boolean;
  isVerified?: boolean;
  playerPerformance?: mongoose.Types.ObjectId; // reference to performance model
}

const playerProfileSchema = new Schema<IPlayerProfile>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  handle: { type: String, unique: true },
  bio: { type: String },
  avatarUrl: { type: String },
  location: { type: String },
  joinedAt: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  playerPerformance: { type: Schema.Types.ObjectId, ref: 'PlayerPerformance' }, // ✅ camelCase + fixed
});

export default mongoose.model<IPlayerProfile>('PlayerProfile', playerProfileSchema);

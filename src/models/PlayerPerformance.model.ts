// models/PlayerPerformance.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerPerformance extends Document {
  user: mongoose.Types.ObjectId; // linked to User
  event: mongoose.Types.ObjectId; // linked to Event
  player: mongoose.Types.ObjectId; // linked to Event
  liftType: 'squat' | 'bench' | 'deadlift';
  weight: number; // kg lifted
  date: Date;
  approved: boolean; // optional: to track if official verified
}

const playerPerformanceSchema = new Schema<IPlayerPerformance>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    player: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional
    liftType: { type: String, enum: ['squat', 'bench', 'deadlift'], required: true },
    weight: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IPlayerPerformance>('PlayerPerformance', playerPerformanceSchema);

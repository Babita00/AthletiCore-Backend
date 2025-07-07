import mongoose, { Schema, Document } from 'mongoose';

export interface IAttempt extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;

  liftType: 'squat' | 'bench' | 'deadlift';
  attemptNumber: 1 | 2 | 3;
  declaredWeight: number;
  actualWeight?: number;
  status?: 'good' | 'fail' | 'pending';
  isCurrent?: boolean;
  completedAt?: Date;
  updateCount?: number;
}

const attemptSchema = new Schema<IAttempt>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },

  liftType: { type: String, enum: ['squat', 'bench', 'deadlift'], required: true },
  attemptNumber: { type: Number, enum: [1, 2, 3], required: true },

  declaredWeight: { type: Number, default: 0 },
  actualWeight: { type: Number },
  status: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
  isCurrent: { type: Boolean, default: false },
  completedAt: { type: Date },
  updateCount: { type: Number, default: 0 },
});

export default mongoose.model<IAttempt>('LiftAttempt', attemptSchema);

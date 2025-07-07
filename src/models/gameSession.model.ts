import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  name: string;
  group?: string; // e.g., A, B, C
  events: ('squat' | 'bench' | 'deadlift')[];
  players: mongoose.Types.ObjectId[];
  startDate?: Date;

  // NEW FIELDS FOR LIVE TRACKING
  currentEvent?: 'squat' | 'bench' | 'deadlift';
  currentAttemptNumber?: 1 | 2 | 3;
  status: 'not_started' | 'in_progress' | 'completed';

  createdAt: Date;
  updatedAt: Date;
}

const gameSessionSchema = new Schema<IGameSession>(
  {
    name: { type: String, required: true },
    group: { type: String }, // Optional: e.g., Group A, Group B
    events: [{ type: String, enum: ['squat', 'bench', 'deadlift'], required: true }],
    players: [{ type: Schema.Types.ObjectId, ref: 'PlayerProfile' }],
    startDate: { type: Date },

    // ADDED: Live session tracking
    currentEvent: { type: String, enum: ['squat', 'bench', 'deadlift'] },
    currentAttemptNumber: { type: Number, enum: [1, 2, 3] },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
  },
  { timestamps: true },
);

export default mongoose.model<IGameSession>('GameSession', gameSessionSchema);

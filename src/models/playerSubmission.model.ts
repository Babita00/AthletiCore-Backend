import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerSubmission extends Document {
  event: mongoose.Types.ObjectId;
  player: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId; // Reference to the user who submitted
  formFields: { key: string; value: string }[];
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: Date;

  finalHeight?: number;
  finalWeight?: number;
  finalRackHeight?: number;
  updatedAt?: Date;

  finalStatsLog?: {
    updatedBy: mongoose.Types.ObjectId;
    finalHeight?: number;
    finalWeight?: number;
    finalRackHeight?: number;
    updatedAt: Date;
  }[];
}

const playerSubmissionSchema = new Schema<IPlayerSubmission>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    formFields: [
      {
        key: String,
        value: String,
      },
    ],

    // Final (officially updated) values
    finalHeight: { type: Number },
    finalWeight: { type: Number },
    finalRackHeight: { type: Number },

    finalStatsLog: [
      {
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        finalHeight: Number,
        finalWeight: Number,
        finalRackHeight: Number,
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    reviewNote: { type: String },
  },
  { timestamps: true },
);
playerSubmissionSchema.index({ event: 1, player: 1 }, { unique: true });

export default mongoose.model<IPlayerSubmission>('PlayerSubmission', playerSubmissionSchema);

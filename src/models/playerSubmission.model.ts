import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerSubmission extends Document {
  event: mongoose.Types.ObjectId;
  player: mongoose.Types.ObjectId;
  formFields: { key: string; value: string }[];
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const playerSubmissionSchema = new Schema<IPlayerSubmission>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    formFields: [
      {
        key: String,
        value: String,
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

export default mongoose.model<IPlayerSubmission>('PlayerSubmission', playerSubmissionSchema);

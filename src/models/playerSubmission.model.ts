// models/playerSubmission.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerSubmission extends Document {
  eventId: mongoose.Types.ObjectId;
  formId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  values: { [key: string]: any }; // e.g. { "Full Name": "John", "Weight": 75 }
}

const PlayerSubmissionSchema = new Schema<IPlayerSubmission>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    formId: { type: Schema.Types.ObjectId, ref: 'EventForm', required: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    values: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export default mongoose.model<IPlayerSubmission>('PlayerSubmission', PlayerSubmissionSchema);

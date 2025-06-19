import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  event?: mongoose.Types.ObjectId;
  expiryDate: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: false },
    expiryDate: { type: Date, required: false },
    attachments: [{ type: String }],
  },
  { timestamps: true },
);

export default mongoose.model<IAnnouncement>('Announcement', announcementSchema);

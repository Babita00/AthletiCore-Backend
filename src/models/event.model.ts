import mongoose, { Document, Schema } from 'mongoose';

export interface IPrize {
  prizeTitle: string;
  weightCategory?: string;
}

export interface IOfficialContact {
  name: string;
  phone_number: string;
  email?: string;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  venue: string;
  date: Date;
  weightCategories: string[];
  competitionType: 'Male' | 'Female' | 'Open';
  prizes: IPrize[];
  coordinator: IOfficialContact;
  otherOfficial: IOfficialContact;
  organizerPhoneNumber: string;
  createdby: mongoose.Types.ObjectId;
  eventImage: string;
}

const prizeSchema = new Schema<IPrize>({
  prizeTitle: { type: String, required: true },
  weightCategory: { type: String },
});

const officialContactSchema = new Schema<IOfficialContact>({
  name: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String },
});

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    venue: { type: String, required: true },
    date: { type: Date, required: true },
    weightCategories: [{ type: String, required: true }],
    competitionType: { type: String, enum: ['Male', 'Female', 'Open'], required: true },
    prizes: [prizeSchema],
    coordinator: { type: officialContactSchema, required: false },
    otherOfficial: { type: officialContactSchema, required: false },
    organizerPhoneNumber: { type: String, required: false },
    eventImage: { type: String, required: false },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

export default mongoose.model<IEvent>('Event', eventSchema);

// models/eventForm.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFormField {
  fieldName: string; // key provided by official
  fieldType: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[]; // for select type
}

export interface IEventForm extends Document {
  eventId: mongoose.Types.ObjectId;
  fields: IFormField[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>({
  fieldName: { type: String, required: true },
  fieldType: { type: String, enum: ['text', 'number', 'date', 'select'], required: true },
  required: { type: Boolean, default: false },
  options: [String],
});

const EventFormSchema = new Schema<IEventForm>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    fields: { type: [FormFieldSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export default mongoose.model<IEventForm>('EventForm', EventFormSchema);

// ----- 2. models/User.ts -----
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  phone_number?: number;
  role: 'Official' | 'Player';
  gender: 'Male' | 'Female' | 'Other';
  password: string;
  age?: number;
  weight?: number;
  matchPassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: { type: String, required: true, unique: true },
    phone_number: { type: Number },
    role: { type: String, enum: ['Official', 'Player'], required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    password: { type: String, required: true },
    age: { type: Number },
    weight: { type: Number },
  },
  { timestamps: true },
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

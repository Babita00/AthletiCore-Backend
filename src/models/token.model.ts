import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
}

const tokenSchema = new Schema<IToken>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
});

const TokenModel = mongoose.model<IToken>('Token', tokenSchema);

export default TokenModel;

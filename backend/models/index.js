import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  usage: { messages: { type: Number, default: 0 }, images: { type: Number, default: 0 }, scripts: { type: Number, default: 0 } },
}, { timestamps: true });
export const User = model('User', userSchema);

const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const chatSchema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
  title: { type: String, default: 'New conversation' },
  messages: [messageSchema],
  linkedChatId: { type: Schema.Types.ObjectId, ref: 'Chat', default: null },
}, { timestamps: true });
export const Chat = model('Chat', chatSchema);

const imageSchema = new Schema({
  userId: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['pending', 'done', 'failed'], default: 'done' },
}, { timestamps: true });
export const Image = model('Image', imageSchema);

const scriptSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  prompt: { type: String, required: true },
  code: { type: String, required: true },
  filePath: { type: String, default: null },
  status: { type: String, enum: ['generated', 'running', 'done', 'failed'], default: 'generated' },
  log: { type: String, default: '' },
  executedAt: { type: Date, default: null },
}, { timestamps: true });
export const Script = model('Script', scriptSchema);

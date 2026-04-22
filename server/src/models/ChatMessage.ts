import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  projectId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    projectId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

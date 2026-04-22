import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  idea: string;
  audience: string;
  flow: string;
  requirementsDoc: string;
  components: object[];
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    idea: { type: String, required: true },
    audience: { type: String, required: true },
    flow: { type: String, required: true },
    requirementsDoc: { type: String, default: "" },
    components: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>("Project", ProjectSchema);

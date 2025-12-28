import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    ageGroup: {
      type: String,
      required: true,
      enum: ["adult", "teen", "kid", "toddler"] // teen=12-13, kid=8, toddler=3-4
    },
    selections: {
      // IDs de items seleccionados (bebidas y mesa dulce)
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

ResponseSchema.index({ name: 1 });

export const Response = mongoose.model("Response", ResponseSchema);
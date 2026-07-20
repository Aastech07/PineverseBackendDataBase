import mongoose from "mongoose";

const fcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const FcmToken = mongoose.model("FcmToken", fcmTokenSchema);

export default FcmToken;

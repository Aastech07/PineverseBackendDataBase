// import mongoose from "mongoose";

// const fcmTokenSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//       trim: true,
//     },
//     fcmToken: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//   },
//   { timestamps: true },
// );

// const FcmToken = mongoose.model("FcmToken", fcmTokenSchema);

// export default FcmToken;

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
    user_role: {
      type: String,
      required: true,
      enum: ["Customer", "Vendor"],
      trim: true,
      index: true,
    },
    fcmToken: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const FcmToken = mongoose.model("FcmToken", fcmTokenSchema);

export default FcmToken;
import mongoose from "mongoose";

const pushNotificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    senderId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    // Flat key-value payload for app routing/navigation
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Full event object (job, bid, chat etc.)
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    pushError: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

pushNotificationSchema.index({ receiverId: 1, createdAt: -1 });

const PushNotification = mongoose.model("PushNotification", pushNotificationSchema);

export default PushNotification;

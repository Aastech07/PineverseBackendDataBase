import express from "express";
import {
  deleteFcmTokenByUserId,
  getFcmTokenByUserId,
  upsertFcmToken,
} from "../controllers/fcmTokenController.js";

const router = express.Router();


// Proper REST-style endpoints
router.post("/fcm-token", upsertFcmToken);
router.get("/fcm-token/:userId", getFcmTokenByUserId);
router.delete("/fcm-token/:userId", deleteFcmTokenByUserId);

export default router;

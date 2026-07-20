import FcmToken from "../models/FcmTokenModel.js";

export const upsertFcmToken = async (req, res) => {
  try {
    const userIdRaw = req.body.userId;
    const fcmTokenRaw = req.body.fcmToken;
    const userId = userIdRaw != null ? String(userIdRaw).trim() : "";
    const fcmToken = fcmTokenRaw != null ? String(fcmTokenRaw).trim() : "";

    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: "userId and fcmToken are required",
      });
    }

    const savedToken = await FcmToken.findOneAndUpdate(
      { userId },
      { userId, fcmToken },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
      data: savedToken,
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save FCM token",
      error: error.message,
    });
  }
};

export const getFcmTokenByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const tokenData = await FcmToken.findOne({ userId: String(userId).trim() });

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: "FCM token not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tokenData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FCM token",
      error: error.message,
    });
  }
};

export const deleteFcmTokenByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const deletedToken = await FcmToken.findOneAndDelete({
      userId: String(userId).trim(),
    });

    if (!deletedToken) {
      return res.status(404).json({
        success: false,
        message: "FCM token not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FCM token deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete FCM token",
      error: error.message,
    });
  }
};

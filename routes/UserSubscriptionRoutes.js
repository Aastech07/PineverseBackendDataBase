import express from "express";
const router = express.Router();

import {
    createSubscription,
    upgradeSubscription,
    getActiveSubscription,
    getPlans,
    checkUserSubscription,
} from "../controllers/UserSubscription.js";

// ✅ First-time subscribe (free trial or first paid plan)
router.post("/subscription", createSubscription);

// ✅ Upgrade existing plan to a new paid plan
router.post("/upgrade", upgradeSubscription);

// 🔍 Get active plan by user ID
router.get("/active/:user_id", getActiveSubscription);
router.get("/plans", getPlans);
router.get("/check-subscription/:userId", checkUserSubscription);
export default router;
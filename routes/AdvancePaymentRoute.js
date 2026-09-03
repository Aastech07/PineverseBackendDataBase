import express from "express";

import {
    createAdvancePayment,
    getAdvancePayments,
} from "../controllers/AdvancePaymentController.js";

const router = express.Router();

// Create Advance Payment
router.post("/createAdvancePayment", createAdvancePayment);

// Get Advance Payments by user_id (query: ?user_id=... ya param: /:user_id)
router.get("/getAdvancePayment", getAdvancePayments);
router.get("/getAdvancePayment/:user_id", getAdvancePayments);

export default router;
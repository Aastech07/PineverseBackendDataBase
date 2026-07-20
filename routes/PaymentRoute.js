import express from "express";
import {
    createPayment,
    updatePaymentStatus,
    getUserPayments,
    getSinglePayment,
    deletePayment,
    getSubscriptionHistory,
    checkActiveSubscription
} from "../controllers/PaymentController.js";

const router = express.Router();

router.post("/Paymentcreate", createPayment);
router.put("/update-status", updatePaymentStatus);
router.get("/user/:user_id", getUserPayments);
router.get("/:transactionId", getSinglePayment);
router.get("/getSubscriptionHistory/:user_id", getSubscriptionHistory);
router.get("/checkActiveSubscription/:user_id", checkActiveSubscription);

router.delete("/:id", deletePayment);

export default router;
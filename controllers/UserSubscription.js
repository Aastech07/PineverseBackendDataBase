import mongoose from "mongoose";
import UserSubscription from "../models/UserSubscription.js";
import Plans from "../models/Plans.js";
import PaymentModel from "../models/PaymentModel.js";

// ─────────────────────────────────────────────────────────────
// ✅ Create Subscription  (first-time: free trial OR first paid)
// ─────────────────────────────────────────────────────────────
export const createSubscription = async (req, res) => {
    try {
        console.log("🔥 SUBSCRIPTION API HIT");
        console.log("BODY 👉", req.body);

        const { user_id, plan, amount = 0, transactionId, razorpayData } = req.body;

        // Validation
        if (!user_id || !plan?.months || !plan?.type) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription data"
            });
        }

        // Expire any old active plans first
        await UserSubscription.updateMany(
            { user_id, status: "active" },
            { $set: { status: "expired" } }
        );

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + plan.months);

        const newSub = await UserSubscription.create({
            user_id,
            plan_type: plan.type,
            plan_name: plan.name || "",
            amount,
            subscription_months: plan.months,
            start_date: startDate,
            expiry_date: expiryDate,
            status: "active",
            is_trial: plan.type === "free",
            transaction_id: transactionId || null,
            razorpay_payment_id: razorpayData?.razorpay_payment_id || null,
            razorpay_order_id: razorpayData?.razorpay_order_id || null,
            previous_plan: null,
            upgraded_at: null,
        });

        return res.json({
            success: true,
            message: "Subscription created successfully 🚀",
            data: newSub
        });

    } catch (error) {
        console.error("Create Subscription Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// ✅ Upgrade Subscription  (switch from one paid plan to another)
// ─────────────────────────────────────────────────────────────
export const upgradeSubscription = async (req, res) => {
    try {
        console.log("🔥 UPGRADE API HIT");
        console.log("BODY 👉", req.body);

        const { user_id, plan, amount = 0, transactionId, razorpayData } = req.body;

        if (!user_id || !plan?.months || !plan?.type) {
            return res.status(400).json({ success: false, message: "Invalid upgrade data" });
        }

        // Grab current active plan BEFORE we expire it (to store as previous_plan)
        const currentSub = await UserSubscription.findOne({
            user_id,
            status: "active"
        }).sort({ expiry_date: -1 });

        const previousPlanType = currentSub?.plan_type || null;

        // Mark old plan as "upgraded" — distinct from "expired" so history stays clean
        await UserSubscription.updateMany(
            { user_id, status: "active" },
            { $set: { status: "upgraded", upgraded_at: new Date() } }
        );

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + plan.months);

        const newSub = await UserSubscription.create({
            user_id,
            plan_type: plan.type,
            plan_name: plan.name || "",
            amount,
            subscription_months: plan.months,
            start_date: startDate,
            expiry_date: expiryDate,
            status: "active",
            is_trial: false,
            transaction_id: transactionId || null,
            razorpay_payment_id: razorpayData?.razorpay_payment_id || null,
            razorpay_order_id: razorpayData?.razorpay_order_id || null,
            previous_plan: previousPlanType,   // what the user had before
            upgraded_at: null,
        });

        return res.json({
            success: true,
            message: `Upgraded from ${previousPlanType} → ${plan.type} 🚀`,
            previous_plan: previousPlanType,
            data: newSub,
        });

    } catch (error) {
        console.error("Upgrade Subscription Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// ✅ Get Active Subscription
// ─────────────────────────────────────────────────────────────
export const getActiveSubscription = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ success: false, message: "User ID required" });
        }

        const sub = await UserSubscription.findOne({
            user_id,
            status: "active"
        }).sort({ expiry_date: -1 });

        // No subscription at all
        if (!sub) {
            return res.json({ success: true, plan: "free", data: null });
        }

        // Auto-expire if past expiry date
        if (new Date() > sub.expiry_date) {
            sub.status = "expired";
            await sub.save();
            return res.json({ success: true, plan: "free", data: null });
        }

        return res.json({ success: true, plan: sub.plan_type, data: sub });

    } catch (error) {
        console.error("Get Subscription Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};




// ✅ Get all active plans
export const getPlans = async (req, res) => {
    try {
        const plans = await Plans.find({ is_active: true }).sort({ price: 1 });

        res.json({
            success: true,
            data: plans
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};






export const checkUserSubscription = async (req, res) => {
    try {
        const { userId } = req.params;

        const MONTHS_TO_PLAN = {
            0: { id: 'free', label: 'Free Trial' },
            3: { id: 'basic', label: 'STARTER' },
            6: { id: 'pro', label: 'PRO' },
            12: { id: 'ent', label: 'ULTIMATE' },
        };

        const payment = await PaymentModel.findOne({
            user_id: userId,
            status: 'success',
        }).sort({ createdAt: -1 });

        // ── Check if free trial was ever used (any time, even expired) ──
        const freeTrialRecord = await PaymentModel.findOne({
            user_id: userId,
            planType: 'free',   // matches what frontend sends: plan.planType
            status: 'success',
        });

        const hasUsedFreeTrial = !!freeTrialRecord;

        if (payment) {
            const months = payment.SubSriptionMonths;
            const planInfo = MONTHS_TO_PLAN[months] ?? { id: 'free', label: 'Free Trial' };

            let daysRemaining = null;
            let isActive = true;

            if (payment.expiryDate) {
                const now = new Date();
                const expiry = new Date(payment.expiryDate);
                isActive = now < expiry;
                daysRemaining = isActive
                    ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
            }

            return res.json({
                success: true,
                hasSubscription: true,
                hasUsedFreeTrial,           // ✅ new field

                planType: planInfo.id,
                planLabel: planInfo.label,
                SubSriptionMonths: months,
                expiryDate: payment.expiryDate ?? null,
                activatedAt: payment.activatedAt ?? null,
                daysRemaining,
                isActive,
                amount: payment.amount,
                planTypeRaw: payment.planType,
            });

        } else {
            return res.json({
                success: true,
                hasSubscription: false,
                hasUsedFreeTrial,           // ✅ new field (could be true if trial expired)

                planType: null,
                planLabel: null,
                SubSriptionMonths: null,
                expiryDate: null,
                activatedAt: null,
                daysRemaining: null,
                isActive: false,
                amount: null,
                planTypeRaw: null,
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};
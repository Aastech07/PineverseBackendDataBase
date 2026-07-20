import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema({
    user_id: {
        type: String,
        ref: "User",
        required: true,
        index: true
    },

    plan_type: {
        type: String,
        enum: ["free", "basic", "pro", "ultimate"],   // ✅ updated to match frontend planType values
        default: "free"
    },

    plan_name: String,

    amount: {
        type: Number,
        default: 0
    },

    currency: {
        type: String,
        default: "INR"
    },

    subscription_months: {
        type: Number,
        required: true
    },

    start_date: {
        type: Date,
        default: Date.now
    },

    expiry_date: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["active", "expired", "cancelled", "pending", "upgraded"],  // ✅ "upgraded" added
        default: "pending",
        index: true
    },

    transaction_id: String,
    razorpay_payment_id: String,
    razorpay_order_id: String,

    is_trial: {
        type: Boolean,
        default: false
    },

    auto_renew: {
        type: Boolean,
        default: false
    },

    // ✅ NEW: upgrade tracking fields
    previous_plan: {
        type: String,
        default: null   // stores the plan_type of the plan that was replaced
    },

    upgraded_at: {
        type: Date,
        default: null   // timestamp when this plan was itself upgraded away from
    },

}, {
    timestamps: true
});

export default mongoose.model("UserSubscription", userSubscriptionSchema);
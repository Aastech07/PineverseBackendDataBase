import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["free", "basic", "premium"],
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    months: {
        type: Number,
        required: true
    },

    // 🔥 Features
    daily_bid_limit: {
        type: Number,
        default: 0
    },

    wallet_amount: {
        type: Number,
        default: 0
    },

    move_limit: {
        type: Number,
        default: 0
    },

    shifting_details: {
        type: String
    },

    is_active: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

export default mongoose.model("Plan", planSchema);
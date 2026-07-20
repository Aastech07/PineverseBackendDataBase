import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
        },
        included: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

const tagSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['popular', 'deal'],
        },
    },
    { _id: false }
);

const subscriptionPlanSchema = new mongoose.Schema(
    {
        icon: {
            type: String,
            required: true,
        },

        planType: {
            type: String,
            enum: ['free', 'paid'],
            required: true,
        },

        label: {
            type: String,
            required: true,
            trim: true,
        },

        duration: {
            type: String,
            required: true,
        },

        months: {
            type: Number,
            default: null,
        },

        pricePerMonth: {
            type: Number,
            default: 0,
        },

        desc: {
            type: String,
            required: true,
            trim: true,
        },

        features: {
            type: [featureSchema],
            default: [],
        },

        tag: {
            type: tagSchema,
            default: null,
        },

        btnText: {
            type: String,
            required: true,
        },

        isFree: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        sortOrder: {
            type: Number,
            default: 0,
        },

        AdvancePayment: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model(
    'SubscriptionPlan',
    subscriptionPlanSchema
);
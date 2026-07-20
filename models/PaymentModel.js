// import mongoose from "mongoose";

// const PaymentSchema = new mongoose.Schema(
//     {
//         user_id: {
//             type: String, // ya mongoose.Schema.Types.ObjectId bhi use kar sakte ho agar User model bana hai
//             required: true,
//         },

//         SubSriptionMonths: {
//             type: Number,
//             enum: [0, 3, 6, 12], // only allowed plans

//         },

//         SubSriptionHistory: {
//             type: Number,
//             default: 0,
//         },

//         transactionId: {
//             type: String,
//             unique: true,
//         },

//         amount: {
//             type: Number,

//         },

//         status: {
//             type: String,
//             enum: ["pending", "success", "failed"],
//             default: "pending",
//         },
//     },
//     { timestamps: true }
// );

// const Payment = mongoose.model("Payment", PaymentSchema);

// export default Payment;

// import mongoose from "mongoose";

// const PaymentSchema = new mongoose.Schema(
//     {
//         user_id: {
//             type: String,
//             required: true,
//         },

//         SubSriptionMonths: {
//             type: Number,
//             enum: [0, 3, 6, 12],
//             required: true,
//         },

//         SubSriptionHistory: {
//             type: Number,
//             default: 0,
//         },

//         transactionId: {
//             type: String,
//             unique: true,
//             sparse: true,
//         },

//         amount: {
//             type: Number,
//             default: 0,
//         },

//         status: {
//             type: String,
//             enum: ["pending", "success", "failed"],
//             default: "pending",
//         },

//         expiryDate: {
//             type: Date,
//             default: null,
//         },

//         activatedAt: {
//             type: Date,
//             default: null,
//         },

//         planType: {
//             type: String,
//             enum: ["free", "paid", "expir"],
//             default: "paid",
//         },

//         // ✅ New field
//         useSubscriptionStatus: {
//             type: String,
//             enum: ["Active", "Inactive"],
//             default: "Inactive",
//         },
//     },
//     { timestamps: true }
// );

// // ✅ Auto-set useSubscriptionStatus before save
// PaymentSchema.pre("save", function (next) {
//     const now = new Date();

//     if (this.status !== "success" || this.planType === "expir") {
//         this.useSubscriptionStatus = "Inactive";
//     } else if (this.planType === "free" && this.SubSriptionMonths === 0) {
//         // Lifetime free plan — always Active
//         this.useSubscriptionStatus = "Active";
//     } else if (this.expiryDate && now < this.expiryDate) {
//         this.useSubscriptionStatus = "Active";
//     } else {
//         this.useSubscriptionStatus = "Inactive";
//     }

//     next();
// });

// // ✅ Also update on findOneAndUpdate (for updatePaymentStatus controller)
// PaymentSchema.pre("findOneAndUpdate", function (next) {
//     const update = this.getUpdate();
//     const now = new Date();

//     const status = update?.status || update?.$set?.status;
//     const planType = update?.planType || update?.$set?.planType;
//     const expiryDate = update?.expiryDate || update?.$set?.expiryDate;

//     let subscriptionStatus = "Inactive";

//     if (status === "success" && planType !== "expir") {
//         if (!expiryDate) {
//             // Lifetime free plan
//             subscriptionStatus = "Active";
//         } else if (now < new Date(expiryDate)) {
//             subscriptionStatus = "Active";
//         }
//     }

//     this.set({ useSubscriptionStatus: subscriptionStatus });
//     next();
// });

// // Indexes
// PaymentSchema.index({ user_id: 1, status: 1, expiryDate: 1 });
// PaymentSchema.index({ transactionId: 1 });

// // Virtual: isActive
// PaymentSchema.virtual("isActive").get(function () {
//     if (this.status !== "success") return false;
//     if (this.planType === "expir") return false;
//     if (this.SubSriptionMonths === 0) return true;
//     if (!this.expiryDate) return false;
//     return new Date() < this.expiryDate;
// });

// // Virtual: daysRemaining
// PaymentSchema.virtual("daysRemaining").get(function () {
//     if (!this.isActive) return 0;
//     if (this.SubSriptionMonths === 0) return null;
//     return Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
// });

// const Payment = mongoose.model("Payment", PaymentSchema);

// export default Payment;

import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    SubSriptionMonths: {
      type: Number,
      enum: [0, 1, 3, 6, 12],
      required: true,
    },

    SubSriptionHistory: {
      type: Number,
      default: 0,
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    planType: {
      type: String,
      enum: ["free", "paid", "expir"],
      default: "paid",
    },

    // ✅ "Paused" added — subscription paused when user buys a new plan
    useSubscriptionStatus: {
      type: String,
      enum: ["Active", "Paused", "Inactive"],
      default: "Inactive",
    },

    /**
     * ✅ Days remaining when this subscription was paused.
     *   -1  → lifetime free plan (will be fully restored)
     *    0  → no time left (will NOT be reactivated)
     *   >0  → these days will be restored when current plan expires
     */
    remainingDaysAtPause: {
      type: Number,
      default: 0,
    },

    // ✅ When this subscription was paused
    pausedAt: {
      type: Date,
      default: null,
    },

    // ✅ When this subscription was reactivated after a pause
    reactivatedAt: {
      type: Date,
      default: null,
    },

    AdvancePayment: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// ════════════════════════════════════════════════════════════════════════════
//  PRE-SAVE HOOK
//  Auto-set useSubscriptionStatus on every .save() call.
//  NOTE: Does NOT touch "Paused" — that is set explicitly by the controller.
// ════════════════════════════════════════════════════════════════════════════
PaymentSchema.pre("save", function (next) {
  // If already Paused, do not override — controller manages this state
  if (this.useSubscriptionStatus === "Paused") return next();

  const now = new Date();

  if (this.status !== "success" || this.planType === "expir") {
    this.useSubscriptionStatus = "Inactive";
  } else if (this.planType === "free" && this.SubSriptionMonths === 0) {
    // Lifetime free plan — always Active
    this.useSubscriptionStatus = "Active";
  } else if (this.expiryDate && now < this.expiryDate) {
    this.useSubscriptionStatus = "Active";
  } else {
    this.useSubscriptionStatus = "Inactive";
  }

  next();
});

// ════════════════════════════════════════════════════════════════════════════
//  PRE findOneAndUpdate HOOK
//  Auto-set useSubscriptionStatus on findOneAndUpdate calls.
//  NOTE: Skips if update explicitly sets "Paused" (controller-driven).
// ════════════════════════════════════════════════════════════════════════════
PaymentSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const now = new Date();

  // If controller is explicitly setting Paused/Inactive, don't override
  const explicitStatus =
    update?.useSubscriptionStatus || update?.$set?.useSubscriptionStatus;
  if (explicitStatus === "Paused" || explicitStatus === "Inactive") {
    return next();
  }

  const status = update?.status || update?.$set?.status;
  const planType = update?.planType || update?.$set?.planType;
  const expiryDate = update?.expiryDate || update?.$set?.expiryDate;

  // Only recalculate when status is being updated
  if (!status) return next();

  let subscriptionStatus = "Inactive";

  if (status === "success" && planType !== "expir") {
    if (!expiryDate) {
      // Lifetime free plan
      subscriptionStatus = "Active";
    } else if (now < new Date(expiryDate)) {
      subscriptionStatus = "Active";
    }
  }

  this.set({ useSubscriptionStatus: subscriptionStatus });
  next();
});

// ════════════════════════════════════════════════════════════════════════════
//  INDEXES
// ════════════════════════════════════════════════════════════════════════════
PaymentSchema.index({ user_id: 1, status: 1, expiryDate: 1 });
PaymentSchema.index({ user_id: 1, useSubscriptionStatus: 1 }); // ✅ new: faster pause/active queries
PaymentSchema.index({ transactionId: 1 });

// ════════════════════════════════════════════════════════════════════════════
//  VIRTUALS
// ════════════════════════════════════════════════════════════════════════════

// isActive — true only when subscription is currently running
PaymentSchema.virtual("isActive").get(function () {
  if (this.status !== "success") return false;
  if (this.planType === "expir") return false;
  if (this.useSubscriptionStatus === "Paused") return false;
  if (this.SubSriptionMonths === 0) return true; // lifetime
  if (!this.expiryDate) return false;
  return new Date() < this.expiryDate;
});

// daysRemaining — null for lifetime, 0 if inactive/paused, number otherwise
PaymentSchema.virtual("daysRemaining").get(function () {
  if (!this.isActive) return 0;
  if (this.SubSriptionMonths === 0) return null; // lifetime
  return Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
});

// daysStoredOnPause — how many days are saved when this plan is Paused
PaymentSchema.virtual("daysStoredOnPause").get(function () {
  if (this.useSubscriptionStatus !== "Paused") return null;
  if (this.remainingDaysAtPause === -1) return "Lifetime";
  return this.remainingDaysAtPause;
});

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;

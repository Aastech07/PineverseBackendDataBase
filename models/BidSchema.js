// import mongoose from "mongoose";

// const bidSchema = new mongoose.Schema(
//   {
//     quotation: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     status: {
//       type: String,
//       enum: ['Negotiable', 'Non-Negotiable'],
//       default: 'Negotiable',
//       required: true,
//     },

//     jobName: { type: String }, // Added from payload

//     costBreakdown: {
//       baseTransport: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       packingCharges: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       loadingUnloadingCharges: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       insuranceCharges: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       storageCharges: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       dismantlingCharges: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       otherCharges: {
//         type: Number,
//         default: 0,
//         min: 0,
//       },
//       totalAmount: {
//         type: Number,
//         required: true,
//         min: 0,
//       },
//     },
//     recipientDetails: {
//       name: { type: String, required: true },
//       image: { type: String, required: true },
//       phone: {
//         type: String,
//         required: true,
//         match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
//       },
//     },
//     validityOfQuote: {
//       type: String,
//       enum: ['7 Days', '10 Days', '1 Month'],
//       default: '7 Days',
//       required: true,
//     },
//     advancePayment: {
//       type: Number,
//       min: 0,
//       max: 100,
//       default: 0,
//       required: true,
//     },
//     noteToCustomer: {
//       type: String,
//       maxlength: 500,
//       default: '',
//     },
//     bidderId: {
//       type: String,
//       required: true,
//     },
//     recipientId: {
//       type: String,
//       required: true,
//     },
//     jobId: {
//       type: String,
//       required: true,
//     },
//     activeStatus: {
//       type: String,
//       enum: ['sent', 'accepted', 'rejected', 'Negotiate'],
//       default: 'sent',
//     },
//     submittedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     servicesProvided: {
//       type: [String],
//       default: [],
//     },
//     locationProvided: {
//       type: [String],
//       default: [],
//     },
//     image: {
//       type: String,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     phone: {
//       type: String,
//       required: true,
//       match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
//     },

//     pickup: {
//       city: { type: String, default: '' },
//       state: { type: String, default: '' },
//       pincode: { type: String, default: '' },
//       location: { type: String, default: '' },
//       addressLine1: { type: String, default: '' },
//       addressLine2: { type: String, default: '' },
//     },

//     drop: {
//       city: { type: String, default: '' },
//       state: { type: String, default: '' },
//       pincode: { type: String, default: '' },
//       location: { type: String, default: '' },
//       addressLine1: { type: String, default: '' },
//       addressLine2: { type: String, default: '' },
//     },

//     jobDetails: {
//       dateOfPacking: { type: String, default: '' },
//       propertySize: { type: String, default: '' },
//     },

//     inventory: [
//       {
//         title: { type: String, required: true },
//         subtitle: { type: String, default: '' },
//         qty: { type: Number, default: 1 },
//       },
//     ],

//     serviceDetails: {
//       packingRequired: { type: String, default: '' },
//       insuranceRequired: { type: String, default: '' },
//       storageRequired: { type: String, default: '' },
//       dismantlingRequired: { type: String, default: '' },
//     },

//     ActiveUserStatus: {
//       type: String,
//       enum: ['In Progress', 'Quote Sent', 'Cancelled', 'Completed', 'Rejected','Under Negotiation'],
//       default: 'In Progress',
//     },

//   },
//   { timestamps: true }
// );

// const Bid = mongoose.model("Bid", bidSchema);

// export default Bid;













import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    quotation: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['Negotiable', 'Non-Negotiable'],
      default: 'Negotiable',
      required: true,
    },

    jobName: { type: String }, // Added from payload

    costBreakdown: {
      baseTransport: {
        type: Number,
        default: 0,
        min: 0,
      },
      packingCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      loadingUnloadingCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      insuranceCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      storageCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      dismantlingCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      otherCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    recipientDetails: {
      name: { type: String, required: true },
      image: { type: String, required: true },
      phone: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
      },
    },
    validityOfQuote: {
      type: String,
      enum: ['7 Days', '10 Days', '1 Month'],
      default: '7 Days',
      required: true,
    },

    advancePayment: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      required: true,
    },

    noteToCustomer: {
      type: String,
      maxlength: 500,
      default: '',
    },
    bidderId: {
      type: String,
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    activeStatus: {
      type: String,
      enum: ['sent', 'accepted', 'rejected', 'Negotiate'],
      default: 'sent',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    servicesProvided: {
      type: [String],
      default: [],
    },
    locationProvided: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },

    pickup: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      location: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
    },

    drop: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      location: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
    },

    // Updated jobDetails with all fields
    // jobDetails: {
    //   dateOfPacking: { type: String, default: null },
    //   propertySize: { type: String, default: null },
    //   truckSize: { type: String, default: null },
    //   status: {
    //     type: String,
    //     enum: ['Posted', 'In Progress', 'Completed', 'Cancelled'],
    //     default: 'Posted'
    //   },
    //   progressStep: { type: Number, default: 0, min: 0 },

    //   // Transport fields
    //   transportDescription: { type: String, default: null },
    //   distance: { type: Number, default: null, min: 0 },
    //   goodsType: { type: String, default: null },

    //   // Storage fields
    //   warehouseLocationRequired: { type: Boolean, default: null },
    //   storageDuration: { type: String, default: null },
    //   storageNotes: { type: String, default: null },
    //   handoverDate: { type: Date, default: null },
    //   vacateDate: { type: Date, default: null },

    //   // Packing fields
    //   packingRequired: { type: Boolean, default: null },
    //   packingDays: { type: Number, default: null, min: 0 },
    //   selectedPackingLayers: [{ type: String }],
    //   selectedPackingPackages: [{ type: String }],
    //   selectedReturnable: { type: Boolean, default: null },

    //   // Labour / Box fields
    //   boxCount: { type: Number, default: null, min: 0 },
    //   labourCount: { type: Number, default: null, min: 0 },

    //   // Custom service fields
    //   customServiceDescription: { type: String, default: null },
    //   additionalCustomNotes: { type: String, default: null },
    //   preferredContactTime: { type: String, default: null },
    // },

    jobDetails: {
      // ── Core ──────────────────────────────────────────────
      dateOfPacking: { type: Date, default: null },
      propertySize: { type: String, default: '' },
      truckSize: { type: String, default: '' },
      status: {
        type: String,
        enum: [
          "Posted",
          "Job Posted",       // ✅ add kiya
          "Bid Received",
          "In Progress",
          "Completed",
          "Under Negotiation",
        ],
        default: "Job Posted",
      },
      progressStep: { type: Number, default: 0 },

      // ── Transport ─────────────────────────────────────────
      transportDescription: { type: String, default: '' },
      distance: { type: String, default: '' },
      goodsType: { type: String, default: '' },

      // ── Storage ───────────────────────────────────────────
      warehouseLocationRequired: { type: String, default: '' },  // ✅ Boolean → String
      storageDuration: { type: String, default: '' },
      storageNotes: { type: String, default: '' },
      handoverDate: { type: Date, default: null },
      vacateDate: { type: Date, default: null },

      // ── Packing ───────────────────────────────────────────
      packingRequired: { type: String, enum: ["Yes", "No", "Partially"], default: "No" },  // ✅ Boolean → String
      packingDays: { type: Number, default: 0 },
      selectedPackingLayers: { type: [String], default: [] },
      selectedPackingPackages: { type: [String], default: [] },
      selectedReturnable: { type: String, default: '' },

      // ── Labour / Box ──────────────────────────────────────
      boxCount: { type: Number, default: 0 },
      labourCount: { type: Number, default: 0 },

      // ── Custom / Misc ─────────────────────────────────────
      customServiceDescription: { type: String, default: '' },
      additionalCustomNotes: { type: String, default: '' },
      preferredContactTime: { type: String, default: '' },
    },


    inventory: [
      {
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        qty: { type: Number, default: 1, min: 1 },
      },
    ],

    serviceDetails: {
      packingRequired: { type: String, default: '' },
      insuranceRequired: { type: String, default: '' },
      storageRequired: { type: String, default: '' },
      dismantlingRequired: { type: String, default: '' },
    },

    ActiveUserStatus: {
      type: String,
      enum: ['In Progress', 'Quote Sent', 'Cancelled', 'Completed', 'Rejected', 'Under Negotiation'],
      default: 'In Progress',
    },

    AdvancePaidPayment: {
      type: Number,
      default: 0
    },

    PendingPayment: {
      type: Number,
      default: 0
    },

    fullPaymentStatus: {
      type: String,
      enum: ['pending', 'hold', 'paid'],
      default: 'pending',
    }

  },
  { timestamps: true }
);

// Add indexes for better query performance
bidSchema.index({ bidderId: 1, jobId: 1 });
bidSchema.index({ recipientId: 1, activeStatus: 1 });
bidSchema.index({ jobId: 1, ActiveUserStatus: 1 });

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
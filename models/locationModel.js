// import mongoose from "mongoose";

// const itemSchema = new mongoose.Schema({
//   title: { type: String },
//   subtitle: { type: String },
//   qty: { type: Number, min: 0 }
// });

// const locationSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//   },
//   image: {
//     type: String,
//   },
//   name: {
//     type: String,
//   },
//   pickup: {
//     location: { type: String },
//     city: { type: String },
//     state: { type: String },
//     addressLine1: { type: String },
//     addressLine2: { type: String },
//     pincode: { type: String },
//   },
//   drop: {
//     location: { type: String },
//     city: { type: String },
//     state: { type: String },
//     addressLine1: { type: String },
//     addressLine2: { type: String },
//     pincode: { type: String },
//   },
//   jobDetails: {
//     dateOfPacking: { type: Date },
//     propertySize: { type: String },
//     truckSize: { type: String }, // Added from payload
//     status: {
//       type: String,
//       enum: ["Posted", "Bid Received", "In Progress", "Completed"],
//       default: "Posted"
//     },
//     progressStep: { type: Number, min: 0, max: 3, default: 0 },
//   },
//   inventory: [itemSchema],
//   serviceDetails: {
//     packingRequired: { type: String, enum: ["Yes", "No", "Partially"] },
//     estimatedValue: { type: String, default: '' },
//     insuranceRequired: { type: String, enum: ["Yes", "No", "Estimated Value"] },
//     storageRequired: { type: String, enum: ["Yes", "No", "Estimated Value"] },
//     dismantlingRequired: { type: String, enum: ["Yes", "No", "Partially"] },
//     packingLayers: {
//       type: [String],   // ✅ Array of strings
//     }, // Added from payload
//     storageDuration: { type: String }, // Added from payload
//     additionalServices: {
//       type: [String],   // ✅ Array of strings
//     }, // Added from payload
//   },
//   moveType: { type: String }, // Added from payload
//   liftAvailable: { type: String }, // Added from payload
//   PickUpFloorNo : { type: String }, // Added from payload
//   DropFloorNo : { type: String }, // Added from payload
//   jobName: { type: String }, // Added from payload
//   Servicerequestid:{type:String},
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },


// });

// const Location = mongoose.model("Location", locationSchema);

// export default Location;





// import mongoose from "mongoose";

// const itemSchema = new mongoose.Schema({
//   title: { type: String },
//   subtitle: { type: String },
//   qty: { type: Number, min: 0 },
// });

// const locationSchema = new mongoose.Schema({
//   userId: { type: String, required: true },
//   image: { type: String },
//   name: { type: String },
//   pickup: {
//     location: { type: String },
//     city: { type: String },
//     state: { type: String },
//     addressLine1: { type: String },
//     addressLine2: { type: String },
//     pincode: { type: String },
//   },
//   drop: {
//     location: { type: String },
//     city: { type: String },
//     state: { type: String },
//     addressLine1: { type: String },
//     addressLine2: { type: String },
//     pincode: { type: String },
//   },
//   jobDetails: {
//     dateOfPacking: { type: Date },
//     propertySize: { type: String },
//     truckSize: { type: String },
//     status: {
//       type: String,
//       enum: ["Posted", "Job Posted", "Bid Received", "In Progress", "Completed", "Under Negotiation"],
//       default: "Job Posted",
//     },
//     progressStep: { type: Number, min: 0, max: 3, default: 0 },
//   },
//   inventory: [itemSchema],

//   RejectJobsId: {
//     type: [String],
//     default: [],
//   },
//   serviceDetails: {
//     packingRequired: { type: String, enum: ["Yes", "No", "Partially"] },
//     estimatedValue: { type: String, default: "" },
//     insuranceRequired: { type: String, enum: ["Yes", "No", "Estimated Value"] },
//     storageRequired: { type: String, enum: ["Yes", "No", "Estimated Value"] },
//     dismantlingRequired: { type: String, enum: ["Yes", "No", "Partially"] },
//     packingLayers: { type: [String] },
//     storageDuration: { type: String },
//     additionalServices: { type: [String] },
//   },
  
//   moveType: { type: String },
//   liftAvailable: { type: String },
//   PickUpFloorNo: { type: String },
//   DropFloorNo: { type: String },
//   jobName: { type: String },

//   Servicerequestid: {
//     type: [String],   // 🔥 array of strings
//     default: [],
//   },

//   // ✅ NEW: 0 = not accepted, 1 = accepted
//   // Publish is only allowed when termsAccepted === 1
//   termsAccepted: {
//     type: Number,
//     enum: [0, 1],
//     default: 0,
//     required: true,
//   },

//   rescheduleStatus: {
//     type: String,
//     enum: ["Pending", "Accepted", "Rejected", "Reschedule"],
//     default: "Pending",
//   },

//   rescheduledate: {
//     type: Date,
//     default: null, // user requested date
//   },

//   scheduleDate: {
//     type: Date,
//     default: null, // final approved date
//   },

//   rescheduleUserId: {
//     type: String,
//   },
  
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// const Location = mongoose.model("Location", locationSchema);
// export default Location;







import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  qty: { type: Number, min: 0 },
});

const bidSchema = new mongoose.Schema({
  quotation: { type: Number },
  status: {
    type: String,
    enum: ["Negotiable", "Fixed"],
    default: "Negotiable",
  },
  validityOfQuote: { type: String, default: "7 Days" },
  advancePayment: { type: Number, default: 0 },
  noteToCustomer: { type: String, default: "" },
  bidderId: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const locationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  image: { type: String },
  name: { type: String },

  pickup: {
    location: { type: String },
    city: { type: String },
    state: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    pincode: { type: String },
  },

  drop: {
    location: { type: String },
    city: { type: String },
    state: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    pincode: { type: String },
  },

  jobDetails: {
    // ── Core ──────────────────────────────────────────────
    dateOfPacking: { type: Date },
    propertySize: { type: String },
    truckSize: { type: String },
    status: {
      type: String,
      enum: [
        "Posted",
        "Job Posted",
        "Bid Received",
        "In Progress",
        "Completed",
        "Under Negotiation",
      ],
      default: "Job Posted",
    },
    progressStep: { type: Number, min: 0, max: 3, default: 0 },

    // ── Transport ─────────────────────────────────────────
    transportDescription: { type: String, default: "" },
    distance: { type: String, default: "" },
    goodsType: { type: String, default: "" },

    // ── Storage ───────────────────────────────────────────
    warehouseLocationRequired: { type: String, default: "" },
    storageDuration: { type: String, default: "" },
    storageNotes: { type: String, default: "" },
    handoverDate: { type: Date, default: null },
    vacateDate: { type: Date, default: null },

    // ── Packing ───────────────────────────────────────────
    packingRequired: { type: String, enum: ["Yes", "No", "Partially"], default: "No" },
    packingDays: { type: Number, default: 0 },
    selectedPackingLayers: { type: [String], default: [] },
    selectedPackingPackages: { type: [String], default: [] },
    selectedReturnable: { type: String, default: "" },

    // ── Labour / Box ──────────────────────────────────────
    boxCount: { type: Number, default: 0 },
    labourCount: { type: Number, default: 0 },

    // ── Custom / Misc ─────────────────────────────────────
    customServiceDescription: { type: String, default: "" },
    additionalCustomNotes: { type: String, default: "" },
    preferredContactTime: { type: String, default: "" },
  },

  inventory: [itemSchema],

  RejectJobsId: {
    type: [String],
    default: [],
  },

  serviceDetails: {
    packingRequired: { type: String, enum: ["Yes", "No", "Partially"] },
    estimatedValue: { type: String, default: "" },
    insuranceRequired: {
      type: String,
      enum: ["Yes", "No", "Estimated Value"],
    },
    storageRequired: { type: String, enum: ["Yes", "No", "Estimated Value"] },
    dismantlingRequired: { type: String, enum: ["Yes", "No", "Partially"] },
    packingLayers: { type: [String], default: [] },
    storageDuration: { type: String },
    additionalServices: { type: [String], default: [] },
  },

  moveType: { type: String },
  liftAvailable: { type: String },
  PickUpFloorNo: { type: String },
  DropFloorNo: { type: String },
  jobName: { type: String },

  // Embedded bids (legacy — also tracked via Bid collection)
  bids: { type: [bidSchema], default: [] },

  Servicerequestid: {
    type: [String],
    default: [],
  },

  // "marketplace" | "private" | any custom string from frontend
  publishType: { type: String, default: "marketplace" },

  // 0 = not accepted, 1 = accepted
  termsAccepted: {
    type: Number,
    enum: [0, 1],
    default: 0,
    required: true,
  },

  rescheduleStatus: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Reschedule"],
    default: "Pending",
  },
  rescheduledate: { type: Date, default: null },
  scheduleDate: { type: Date, default: null },
  rescheduleUserId: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Location = mongoose.model("Location", locationSchema);
export default Location;













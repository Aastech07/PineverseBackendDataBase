import mongoose from "mongoose";

const StatusSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: [
                "Posted",
                "Bid Received",
                "Pickup_Scheduled",
                "In_Transit",
                "In Progress",
                "Completed",
            ],
            default: "Posted",
        },

        JobId: {
            type: String,
            required: true,
        },

        statusTimestamps: {
            postedAt: { type: Date },
            bidReceivedAt: { type: Date },
            pickupScheduledAt: { type: Date },
            inTransitAt: { type: Date },
            inProgressAt: { type: Date },
            completedAt: { type: Date },
        },
    },
    { timestamps: true }
);


// 🔥 AUTO UPDATE TIMESTAMP BASED ON STATUS
StatusSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    const status = update.status;

    if (status) {
        const now = new Date();

        switch (status) {
            case "Posted":
                this.set({ "statusTimestamps.postedAt": now });
                break;

            case "Bid Received":
                this.set({ "statusTimestamps.bidReceivedAt": now });
                break;

            case "Pickup_Scheduled":
                this.set({ "statusTimestamps.pickupScheduledAt": now });
                break;

            case "In_Transit":
                this.set({ "statusTimestamps.inTransitAt": now });
                break;

            case "In Progress":
                this.set({ "statusTimestamps.inProgressAt": now });
                break;

            case "Completed":
                this.set({ "statusTimestamps.completedAt": now });
                break;
        }
    }

    next();
});

export default mongoose.model("Status", StatusSchema);
import mongoose from "mongoose";

const StatusSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            default: "Job Posted",
        },

        JobId: {
            type: String,
            required: true,
            unique: true,
        },

        statusTimestamps: {
            postedAt: { type: Date },
            bidReceivedAt: { type: Date },
            pickupScheduledAt: { type: Date },
            inTransitAt: { type: Date },
            inProgressAt: { type: Date },
            completedAt: { type: Date },
            deliveredAt: { type: Date },
        },

        statusHistory: [
            {
                status: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            }
        ]
    },
    { timestamps: true }
);


// 🔥 AUTO UPDATE TIMESTAMP AND HISTORY BASED ON STATUS
StatusSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    let status = "";

    // Extract status from update
    if (this._update.$set && this._update.$set.status) {
        status = this._update.$set.status;
    } else if (this._update.status) {
        status = this._update.status;
    }

    if (status) {
        const now = new Date();
        
        // Ensure $push exists and add to history directly via this._update
        if (!this._update.$push) {
            this._update.$push = {};
        }
        
        this._update.$push.statusHistory = { status, timestamp: now };

        switch (status) {
            case "Job Posted":
            case "Posted":
                this.set({ "statusTimestamps.postedAt": now });
                break;

            case "Bid Received":
                this.set({ "statusTimestamps.bidReceivedAt": now });
                break;

            case "Pickup Scheduled":
            case "Pickup_Scheduled":
                this.set({ "statusTimestamps.pickupScheduledAt": now });
                break;

            case "In Transit":
            case "In_Transit":
                this.set({ "statusTimestamps.inTransitAt": now });
                break;

            case "In Progress":
            case "Job Starts":
                this.set({ "statusTimestamps.inProgressAt": now });
                break;

            case "Delivered & Unpacked":
            case "Delivered_Unpacked":
                this.set({ "statusTimestamps.deliveredAt": now });
                break;

            case "Job Completed":
            case "Completed":
                this.set({ "statusTimestamps.completedAt": now });
                break;
        }
    }

    next();
});

export default mongoose.model("Status", StatusSchema);

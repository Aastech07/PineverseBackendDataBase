import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },

        userRole: {
            type: String,
            enum: ["vendor", "customer"],
            default: "vendor",
        },
    },
    {
        timestamps: true,
    }
);

const UserRoleModel = mongoose.model("UserRole", userRoleSchema);

export default UserRoleModel;
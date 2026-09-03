import UserRoleModel from "../models/UserRoleModel.js";

/**
 * Create User Role
 */
export const createUserRole = async (req, res) => {
    try {
        const { userId, userRole } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User Id is required",
            });
        }

        const existingRole = await UserRoleModel.findOne({ userId });

        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: "User role already exists",
            });
        }

        const role = await UserRoleModel.create({
            userId,
            userRole,
        });

        return res.status(201).json({
            success: true,
            message: "User role created successfully",
            data: role,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get All User Roles
 */
export const getAllUserRoles = async (req, res) => {
    try {
        const roles = await UserRoleModel.find().populate("userId");

        return res.status(200).json({
            success: true,
            count: roles.length,
            data: roles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get User Role By Id
 */
export const getUserRoleById = async (req, res) => {
    try {
        const role = await UserRoleModel.findById(req.params.id).populate("userId");

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Role By User Id
 */
export const getRoleByUserId = async (req, res) => {
    try {
        const role = await UserRoleModel.findOne({
            userId: req.params.userId,
        }).populate("userId");

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Update User Role
 */
export const updateUserRole = async (req, res) => {
    try {
        const role = await UserRoleModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: role,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Delete User Role By User Id
 */
export const deleteUserRole = async (req, res) => {
    try {
        const userId = req.params.userId 
        const role = await UserRoleModel.findOneAndDelete({ userId });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
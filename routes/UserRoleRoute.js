import express from "express";

import {
    createUserRole,
    getAllUserRoles,
    getUserRoleById,
    getRoleByUserId,
    updateUserRole,
    deleteUserRole,
} from "../controllers/UserRoleModel.js";

const router = express.Router();

// Create
router.post("/UserRoleCreate", createUserRole);

// Get All
router.get("/getAllUserRoles", getAllUserRoles);

// Get By User Id
router.get("/getRoleByUserId/:userId", getRoleByUserId);

// Get By Id
router.get("/getUserRoleById/:id", getUserRoleById);

// Update
router.put("/updateUserRole/:id", updateUserRole);

// Delete
router.delete("/deleteUserRole/:userId", deleteUserRole);

export default router;
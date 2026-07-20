import express from "express";
import {
    getStatusByJobId,
} from "../controllers/Statuscontroller.js";

const router = express.Router();


router.get("/jobStatus/:JobId", getStatusByJobId);

export default router;
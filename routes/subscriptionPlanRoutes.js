import express from 'express';

import {
    createPlan,
    deletePlan,
    getPlanById, 
    getPlandata,
    reactivatePlan
} from '../controllers/subscriptionPlanController.js';

const router = express.Router();

// Create Plan
router.post('/createPlan', createPlan);

// Get All Plans
router.get('/getAllPlans', getPlandata);

router.get('/getPlanById', getPlanById)
// Delete Plan
router.delete('/deletePlan/:id', deletePlan);
router.patch('/reactivatePlan/:id', reactivatePlan);

export default router;
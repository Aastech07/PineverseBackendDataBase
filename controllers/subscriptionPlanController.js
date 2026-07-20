import SubscriptionPlan from '../models/SubscriptionPlan.js';

/**
 * Create Plan
 */
export const createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: plan,
        });
    } catch (error) {
         console.log("ERROR =>", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get All Plans
 */
export const getPlandata = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find()
            .sort({ sortOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: plans.length,
            data: plans,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Get Single Plan
 */
export const getPlanById = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found',
            });
        }

        res.status(200).json({
            success: true,
            data: plan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Update Plan
 */
export const updatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Plan updated successfully',
            data: plan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Delete Plan
 */
// export const deletePlan = async (req, res) => {
//     try {
//         const plan = await SubscriptionPlan.findByIdAndDelete(
//             req.params.id
//         );

//         if (!plan) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Plan not found',
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Plan deleted successfully',
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

export const deletePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Plan deactivated successfully',
            data: plan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const reactivatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Plan reactivated successfully',
            data: plan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
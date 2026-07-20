import Status from "../models/Statusmodel.js";


// ✅ GET BY JOB ID
export const getStatusByJobId = async (req, res) => {
    try {
        const { JobId } = req.params;

        const data = await Status.findOne({ JobId });

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
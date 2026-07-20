import express from "express";
import {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  getLocationsByUserId,
  getLocationsByServiceRequestId,
  RejectJob,
  getRejectJobsId,
  getAllCountsLocations,
  requestReschedule,
  updateRescheduleStatus,
  getRescheduleDetails,
  addServiceRequestId,
  getAllJobs
} from "../controllers/locationController.js";

const router = express.Router();

router.post("/createLocation", createLocation);

router.get("/getLocations", getLocations);

router.get("/getAllJobs", getAllJobs);

router.get("/getLocation/:id", getLocationById);
// ✅ New Route - Get by UserId
router.get("/getLocationsByUser/:userId", getLocationsByUserId);

router.put("/updateLocation/:id", updateLocation);

router.patch("/addServiceRequestId/:id", addServiceRequestId);

router.delete("/deleteLocation/:id", deleteLocation);

router.get("/getServiceLocations/:servicerequestid", getLocationsByServiceRequestId);

router.post("/RejectJob", RejectJob);

router.post("/getRejectJobsId", getRejectJobsId);

router.get("/getAllCountsLocations", getAllCountsLocations);

router.post("/requestReschedule", requestReschedule);

router.put("/updateRescheduleStatus/:locationId", updateRescheduleStatus);

router.get("/getRescheduleDetails", getRescheduleDetails);

export default router;

import express from "express";
import { 
  getVillaLocations,
  registerStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} from "../controllers/staffController.js";


const router = express.Router();

// Public route (doesn't require auth)
router.get("/villas/locations", getVillaLocations);



// Staff registration and management
router.post("/register", registerStaff);
router.get("/", getAllStaff);
router.get("/:id", getStaffById);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);


export default router;
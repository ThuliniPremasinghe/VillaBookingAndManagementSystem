import { Router } from "express";
const router = Router();
import { addRoom, getVillasWithRooms, updateRoom, deleteRoom, getRoomById,getVillaLocations  } from "../controllers/roomController.js";

router.post("/addingrooms", addRoom);
router.get("/viewvilla", getVillasWithRooms);
router.get("/room/:id", getRoomById);  // Make sure this route matches what you're calling in the frontend
router.put("/editroom/:id", updateRoom);
router.delete("/deleteroom/:id", deleteRoom);
router.get("/locations", getVillaLocations);

export default router;
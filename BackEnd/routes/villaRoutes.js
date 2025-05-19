import { Router } from "express";
import { addVilla, getVillaById, updateVilla, deleteVilla } from "../controllers/villaController.js";

const router = Router();

router.post("/addingvilla", addVilla);
router.get("/villa/:id", getVillaById);  // Changed from /viewvilla/:id to /villa/:id
router.put("/editvilla/:id", updateVilla);
router.delete("/deleteVilla/:id", deleteVilla);  // Changed from /viewvilla/:id to /villa/:id


export default router;
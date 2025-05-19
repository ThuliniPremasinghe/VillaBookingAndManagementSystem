// routes/searchRoutes.js
import { Router } from "express";
const router = Router();
import { getVillaLocations, searchProperties  } from "../controllers/searchController.js";


router.get("/homepage/locations", getVillaLocations);
router.post("/homepage", searchProperties);



export default router;
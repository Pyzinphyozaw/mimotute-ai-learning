import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {upload} from '../middlewares/multer.middleware.js'
import { getUserProfileDetails,updateProfilePic } from '../controllers/profile.controller.js';

const router = Router();
router.use(protectRoute)
router.put('/changeprofile',upload.single('profilePic'), updateProfilePic);
router.get('/details', getUserProfileDetails);

export default router
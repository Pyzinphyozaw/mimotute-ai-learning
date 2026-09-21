import { Router } from "express";
import { checkUser,login,signup,logout,changeProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { updateProfilePic } from '../controllers/profile.controller.js';

const router = Router();
router.get('/me',checkUser)
router.post('/login',login)
router.post('/signup',signup)
router.post('/logout',logout)
router.post('/changeProfile',protectRoute,upload.single('profilePic'), updateProfilePic)

export default router
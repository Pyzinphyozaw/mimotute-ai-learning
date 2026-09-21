import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { converse } from "../controllers/book.controller.js";


const router = Router();

router.use(protectRoute)
router.post('/userchat',converse)


export default router
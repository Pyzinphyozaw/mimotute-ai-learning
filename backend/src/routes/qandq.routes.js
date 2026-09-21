import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { populateUserQandQuiz } from "../controllers/qandq.controller.js";

const router=Router();

router.use(protectRoute);
router.post('/all',populateUserQandQuiz);

export default router;
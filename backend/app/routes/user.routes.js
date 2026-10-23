import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/user.controller.js";
const router = Router(); router.use(authenticate);
router.get("/:id", controller.findOne); router.put("/:id", controller.update);
export default router;

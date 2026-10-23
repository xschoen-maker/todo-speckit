import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/todo.controller.js";
const router = Router();
router.get("/lists/:listId/todos", authenticate, controller.findAll);
router.post("/lists/:listId/todos", authenticate, controller.create);
router.put("/todos/:id", authenticate, controller.update);
router.delete("/todos/:id", authenticate, controller.remove);
export default router;

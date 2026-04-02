import express from 'express';
import TaskController from '../controllers/TaskController.js';
import validateData from '../middleware/validateData.js';
import taskSchema from '../validations/taskSchema.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all task routes
router.use(authMiddleware.protect);

router
  .route('/')
  .post(validateData(taskSchema.create), TaskController.createTask)
  .get(TaskController.getTasks);

router
  .route('/:id')
  .get(TaskController.getTask)
  .patch(validateData(taskSchema.update), TaskController.updateTask)
  .delete(TaskController.deleteTask);

export default router;

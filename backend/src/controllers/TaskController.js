import catchAsync from '../utils/catchAsync.js';
import TaskService from '../services/TaskService.js';

class TaskController {
  createTask = catchAsync(async (req, res, next) => {
    const task = await TaskService.createTask(req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: {
        task
      }
    });
  });

  getTasks = catchAsync(async (req, res, next) => {
    const result = await TaskService.getTasks(req.user._id, req.query);
    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  getTask = catchAsync(async (req, res, next) => {
    const task = await TaskService.getTask(req.params.id, req.user._id);
    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  });

  updateTask = catchAsync(async (req, res, next) => {
    const task = await TaskService.updateTask(req.params.id, req.user._id, req.body);
    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  });

  deleteTask = catchAsync(async (req, res, next) => {
    await TaskService.deleteTask(req.params.id, req.user._id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
}

export default new TaskController();

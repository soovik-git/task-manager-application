import TaskRepository from '../repositories/TaskRepository.js';
import AppError from '../utils/AppError.js';

class TaskService {
  async createTask(taskData, userId) {
    const data = { ...taskData, user_id: userId };
    return await TaskRepository.create(data);
  }

  async getTasks(userId, queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const search = queryParams.search || '';

    return await TaskRepository.findWithPaginationAndSearch(userId, page, limit, search);
  }

  async getTask(taskId, userId) {
    const task = await TaskRepository.findByIdAndUserId(taskId, userId);
    if (!task) {
      throw new AppError('No task found with that ID', 404);
    }
    return task;
  }

  async updateTask(taskId, userId, updateData) {
    const task = await TaskRepository.update(taskId, userId, updateData);
    if (!task) {
      throw new AppError('No task found with that ID', 404);
    }
    return task;
  }

  async deleteTask(taskId, userId) {
    const task = await TaskRepository.softDelete(taskId, userId);
    if (!task) {
      throw new AppError('No task found with that ID', 404);
    }
    return null; // Successfully deleted
  }
}

export default new TaskService();

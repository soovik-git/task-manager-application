import Task from '../models/Task.js';

class TaskRepository {
  async create(taskData) {
    return await Task.create(taskData);
  }

  async findWithPaginationAndSearch(userId, page, limit, search) {
    const query = { user_id: userId };
    
    // Search by title if provided
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort('-created_at')
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(query);

    return {
      tasks,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findByIdAndUserId(taskId, userId) {
    return await Task.findOne({ _id: taskId, user_id: userId });
  }

  async update(taskId, userId, updateData) {
    return await Task.findOneAndUpdate(
      { _id: taskId, user_id: userId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async softDelete(taskId, userId) {
    return await Task.findOneAndUpdate(
      { _id: taskId, user_id: userId },
      { deleted_at: new Date() },
      { new: true }
    );
  }
}

export default new TaskRepository();

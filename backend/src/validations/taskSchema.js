import Joi from 'joi';

const taskSchema = {
  create: Joi.object({
    title: Joi.string().trim().min(3).max(100).required().messages({
      'string.empty': 'Task title cannot be empty',
      'string.min': 'Task title must be at least 3 characters',
      'string.max': 'Task title cannot exceed 100 characters',
      'any.required': 'Task title is required'
    }),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    status: Joi.string().valid('pending', 'ongoing', 'completed').optional()
  }),
  update: Joi.object({
    title: Joi.string().trim().min(3).max(100).optional(),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    status: Joi.string().valid('pending', 'ongoing', 'completed').optional()
  })
};

export default taskSchema;

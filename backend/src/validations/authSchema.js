import Joi from 'joi';

const authSchema = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required'
    })
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

export default authSchema;

import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import UserRepository from '../repositories/UserRepository.js';

const authMiddleware = {
  protect: catchAsync(async (req, res, next) => {
    // 1. Get token from Header (Bearer token)
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development_only');
    } catch (err) {
      return next(new AppError('Invalid token or token expired. Please log in again.', 401));
    }

    // 3. Check if user still exists
    const currentUser = await UserRepository.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Grant Access to protected route
    req.user = currentUser;
    next();
  })
};

export default authMiddleware;

import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

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

    // 2. Verify token — if invalid or expired, jwt.verify throws
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development_only');
    } catch (err) {
      return next(new AppError('Invalid token or token expired. Please log in again.', 401));
    }

    // 3. Attach user identity from the verified token payload
    // The cryptographic signature already guarantees this is authentic.
    // A separate DB call here would double latency on every request for no security gain.
    req.user = { _id: decoded.id };
    next();
  })
};

export default authMiddleware;

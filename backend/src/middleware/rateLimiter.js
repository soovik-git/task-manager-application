import rateLimit from 'express-rate-limit';

// Strict limiter for auth routes — 10 attempts per 15 mins prevents brute force attacks
export const authLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many auth attempts from this IP, please try again after 15 minutes!'
});

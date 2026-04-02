import express from 'express';
import AuthController from '../controllers/AuthController.js';
import validateData from '../middleware/validateData.js';
import authSchema from '../validations/authSchema.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validateData(authSchema.register), AuthController.register);
router.post('/login', authLimiter, validateData(authSchema.login), AuthController.login);
router.get('/refresh', AuthController.refresh);

// Protected routes
router.post('/logout', AuthController.logout); // No protect — must work with expired access token
router.get('/me', authMiddleware.protect, AuthController.getMe);

export default router;

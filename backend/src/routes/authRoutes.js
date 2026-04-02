import express from 'express';
import AuthController from '../controllers/AuthController.js';
import validateData from '../middleware/validateData.js';
import authSchema from '../validations/authSchema.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', validateData(authSchema.register), AuthController.register);
router.post('/login', validateData(authSchema.login), AuthController.login);
router.get('/refresh', AuthController.refresh);

// Protected routes
router.get('/logout', authMiddleware.protect, AuthController.logout);
router.get('/me', authMiddleware.protect, AuthController.getMe);

export default router;

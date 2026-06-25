import express from 'express';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { loginSchema } from './auth.validation.js';
import { loginController, logoutController } from './auth.controller.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { rateLimitAuth } from '../../../shared/middlewares/rateLimit.middleware.js';

const router = express.Router();

// POST /api/auth/login → Rate limit → Validate → Đăng nhập
router.post('/login', rateLimitAuth, validateData(loginSchema), loginController);

// POST /api/auth/logout → Phải có token hợp lệ → Đưa token vào blacklist
router.post('/logout', verifyToken, logoutController);

export default router;
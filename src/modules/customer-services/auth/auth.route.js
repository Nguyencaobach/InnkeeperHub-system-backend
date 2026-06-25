import express from 'express';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
} from './auth.validation.js';
import {
    registerController,
    loginController,
    forgotPasswordController,
    logoutController,
} from './auth.controller.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { rateLimitAuth, rateLimitForgot } from '../../../shared/middlewares/rateLimit.middleware.js';

const router = express.Router();

// POST /api/customer-auth/register        → Rate limit → Validate → Đăng ký
router.post('/register', rateLimitAuth, validateData(registerSchema), registerController);

// POST /api/customer-auth/login           → Rate limit → Validate → Đăng nhập
router.post('/login',    rateLimitAuth, validateData(loginSchema),    loginController);

// POST /api/customer-auth/forgot-password → Rate limit chặt → Validate → Gửi mail
router.post('/forgot-password', rateLimitForgot, validateData(forgotPasswordSchema), forgotPasswordController);

// POST /api/customer-auth/logout          → Phải có token → Đưa vào blacklist
router.post('/logout', verifyToken, logoutController);

export default router;

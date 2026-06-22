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
} from './auth.controller.js';

const router = express.Router();

// POST /api/customer-auth/register        → Validate → Đăng ký tài khoản
router.post('/register', validateData(registerSchema), registerController);

// POST /api/customer-auth/login           → Validate → Đăng nhập & nhận accessToken
router.post('/login',    validateData(loginSchema),    loginController);

// POST /api/customer-auth/forgot-password → Validate → Tạo mật khẩu tạm & gửi email
router.post('/forgot-password', validateData(forgotPasswordSchema), forgotPasswordController);

export default router;

import express from 'express';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { loginSchema } from './auth.validation.js';
import { loginController } from './auth.controller.js';

const router = express.Router();

// Lắp ráp: Yêu cầu POST -> Middleware soi luật (loginSchema) -> Đúng thì đẩy vào loginController
router.post('/login', validateData(loginSchema), loginController);

export default router;
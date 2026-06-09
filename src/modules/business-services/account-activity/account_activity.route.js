import express from 'express';
import { createActivityLog, getAllActivityLogs, deleteActivityLogs } from './account_activity.controller.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { logSchema } from './account_activity.validation.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { requireRole } from '../../../shared/middlewares/role.middleware.js';

const router = express.Router();

// 1. Phễu 1: Yêu cầu phải đăng nhập (Có token hợp lệ)
router.use(verifyToken);

// 2. Phễu 2: Chặn cứng, chỉ cho phép ADMIN và MANAGER sử dụng API trong file này
router.use(requireRole(['ADMIN', 'MANAGER']));

// 3. Các API thao tác
router.get('/', getAllActivityLogs);
router.post('/', validateData(logSchema), createActivityLog);

// Xóa log cũ theo ngày — chỉ ADMIN mới được phép
router.delete('/before/:beforeDate', requireRole(['ADMIN']), deleteActivityLogs);

export default router;
import express from 'express';
import { createStaff, getAllStaff, updateStaff, deleteStaff } from './staff.controller.js';
import { createStaffSchema, updateStaffSchema } from './staff.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { withCache, invalidateCache } from '../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../shared/services/cache.service.js';

const router = express.Router();

// 1. Gắn "Bảo vệ cổng": Áp dụng verifyToken cho tất cả các route bên dưới
// Chỉ người đã đăng nhập mới có thể xem hoặc thao tác với danh sách nhân viên
router.use(verifyToken);

// [GET] Lấy danh sách toàn bộ nhân viên — Cache 10 phút
router.get('/', withCache('staff:all', TTL.NORMAL), getAllStaff);

// [POST] Thêm nhân viên mới: Đi qua Joi kiểm tra dữ liệu -> Controller
router.post('/', validateData(createStaffSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('staff:*'); });
    next();
}, createStaff);

// [PUT] Cập nhật nhân viên: Đi qua Joi (schema update) -> Controller
router.put('/:id', validateData(updateStaffSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('staff:*'); });
    next();
}, updateStaff);

// [DELETE] Khóa tài khoản nhân viên
router.delete('/:id', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('staff:*'); });
    next();
}, deleteStaff);

export default router;
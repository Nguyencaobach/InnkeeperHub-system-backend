import express from 'express';
import { createStaff, getAllStaff, updateStaff, deleteStaff } from './staff.controller.js';
import { createStaffSchema, updateStaffSchema } from './staff.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// 1. Gắn "Bảo vệ cổng": Áp dụng verifyToken cho tất cả các route bên dưới
// Chỉ người đã đăng nhập mới có thể xem hoặc thao tác với danh sách nhân viên
router.use(verifyToken);

// 2. Định nghĩa các Route:

// [GET] Lấy danh sách toàn bộ nhân viên (Không cần kiểm tra body)
router.get('/', getAllStaff);

// [POST] Thêm nhân viên mới: Đi qua Joi kiểm tra dữ liệu -> Controller
router.post('/', validateData(createStaffSchema), createStaff);

// [PUT] Cập nhật nhân viên: Đi qua Joi (schema update) -> Controller
router.put('/:id', validateData(updateStaffSchema), updateStaff);

// [DELETE] Khóa tài khoản nhân viên
router.delete('/:id', deleteStaff);

export default router;
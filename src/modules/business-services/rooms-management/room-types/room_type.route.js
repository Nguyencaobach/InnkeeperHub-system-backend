import express from 'express';
import { createRoomType, getAllRoomTypes, updateRoomType, deleteRoomType } from './room_type.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { roomTypeSchema } from './room_type.validation.js';
import { uploadRoomImage } from '../../../../shared/middlewares/upload.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

// Áp dụng verifyToken cho tất cả các route ở đây nếu cần bảo mật
router.use(verifyToken);

// Đọc danh sách — Cache 6 giờ (loại phòng ít thay đổi)
router.get('/', withCache('room-types:all', TTL.VERY_LONG), getAllRoomTypes);

// Thêm mới: Nhận ảnh (single) -> Joi kiểm tra -> Đẩy vào Controller
router.post('/', uploadRoomImage.single('image'), validateData(roomTypeSchema), createRoomType);

// Cập nhật: Tương tự thêm mới
router.put('/:id', uploadRoomImage.single('image'), validateData(roomTypeSchema), updateRoomType);

// Xóa (Không cần Joi)
router.delete('/:id', deleteRoomType);

export default router;
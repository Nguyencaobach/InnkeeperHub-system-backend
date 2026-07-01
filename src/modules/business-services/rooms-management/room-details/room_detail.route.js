import express from 'express';
import { createRoomDetail, getAllRoomDetails, updateRoomDetail, deleteRoomDetail } from './room_detail.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { roomDetailSchema } from './room_detail.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withCache, invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

// Gắn "Bảo vệ cổng": Áp dụng verifyToken cho tất cả các route bên dưới để bắt buộc phải đăng nhập
router.use(verifyToken);

// [GET] Lấy danh sách toàn bộ phòng — Cache 10 phút
router.get('/', withCache('room-details:all', TTL.NORMAL), getAllRoomDetails);

// [POST] Thêm phòng mới: Đi qua Joi kiểm tra dữ liệu -> Đẩy vào Controller
router.post('/', validateData(roomDetailSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('room-details:*', 'customer:*room-details:*'); });
    next();
}, createRoomDetail);

// [PUT] Cập nhật thông tin phòng: Đi qua Joi kiểm tra dữ liệu -> Đẩy vào Controller
router.put('/:id', validateData(roomDetailSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('room-details:*', 'customer:*room-details:*'); });
    next();
}, updateRoomDetail);

// [DELETE] Xóa phòng (Không cần Joi)
router.delete('/:id', async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('room-details:*', 'customer:*room-details:*'); });
    next();
}, deleteRoomDetail);

export default router;
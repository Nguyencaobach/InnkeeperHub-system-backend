import express from 'express';
import { createRoomDetail, getAllRoomDetails, updateRoomDetail, deleteRoomDetail } from './room_detail.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { roomDetailSchema } from './room_detail.validation.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';

const router = express.Router();

// 1. Gắn "Bảo vệ cổng": Áp dụng verifyToken cho tất cả các route bên dưới để bắt buộc phải đăng nhập
router.use(verifyToken);

// 2. Định nghĩa các Route:

// [GET] Lấy danh sách toàn bộ phòng (Không cần Joi kiểm tra body)
router.get('/', getAllRoomDetails);

// [POST] Thêm phòng mới: Đi qua Joi kiểm tra dữ liệu -> Đẩy vào Controller
router.post('/', validateData(roomDetailSchema), createRoomDetail);

// [PUT] Cập nhật thông tin phòng: Đi qua Joi kiểm tra dữ liệu -> Đẩy vào Controller
router.put('/:id', validateData(roomDetailSchema), updateRoomDetail);

// [DELETE] Xóa phòng (Không cần Joi)
router.delete('/:id', deleteRoomDetail);

export default router;
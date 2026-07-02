import express from 'express';
import customerRoomController from './room.controller.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js'; // Bổ sung bảo vệ
import { validateData } from '../../../../shared/middlewares/validation.middleware.js'; // Bổ sung Joi
import { ratingSchema } from './room.validation.js'; // Bổ sung Schema

const router = express.Router();

// [GET] Lấy danh sách toàn bộ loại phòng (Kèm số sao trung bình) - Không cần đăng nhập
router.get(
    '/',
    withCache('customer:discover:room-types:all', 21600),
    customerRoomController.getAllRoomTypes.bind(customerRoomController)
);

// [GET] Lấy danh sách phòng chi tiết (room_details) của một loại phòng
router.get(
    '/:id/rooms',
    customerRoomController.getRoomsByType.bind(customerRoomController)
);

// [POST] Đánh giá loại phòng - Bắt buộc ĐĂNG NHẬP (verifyToken) và kiểm tra Data từ 1-5 sao
router.post(
    '/:id/rate',
    verifyToken, 
    validateData(ratingSchema),
    customerRoomController.rateRoomType.bind(customerRoomController)
);

export default router;

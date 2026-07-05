import express from 'express';
import customerRoomController from './room.controller.js';
import { withCache, withUserCache } from '../../../../shared/middlewares/cache.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js'; // Bổ sung bảo vệ
import { validateData } from '../../../../shared/middlewares/validation.middleware.js'; // Bổ sung Joi
import { ratingSchema } from './room.validation.js'; // Bổ sung Schema

const router = express.Router();

// ─── ROUTE TĨNH (phải đặt trước route động /:id) ────────────────────────────

// [GET] Lấy danh sách toàn bộ loại phòng (Kèm số sao trung bình) - Không cần đăng nhập
router.get(
    '/',
    withCache('customer:discover:room-types:all', 21600),
    customerRoomController.getAllRoomTypes.bind(customerRoomController)
);

// [GET] Danh sách phòng đã lưu - Bắt buộc ĐĂNG NHẬP, cache 60 giây
router.get(
    '/saved',
    verifyToken,
    withUserCache('customer:saved-rooms', 60),
    customerRoomController.getMySavedRooms.bind(customerRoomController)
);

// [POST] Lưu phòng - Bắt buộc ĐĂNG NHẬP
router.post(
    '/saved/:roomTypeId',
    verifyToken,
    customerRoomController.saveRoom.bind(customerRoomController)
);

// [DELETE] Xóa phòng đã lưu - Bắt buộc ĐĂNG NHẬP
router.delete(
    '/saved/:roomTypeId',
    verifyToken,
    customerRoomController.removeSavedRoom.bind(customerRoomController)
);

// ─── ROUTE ĐỘNG (chứa :id — phải đặt sau route tĩnh) ────────────────────────

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

import express from 'express';
import customerRoomTypeController from './room-types.controller.js';
import { withCache } from '../../../../shared/middlewares/cache.middleware.js';

const router = express.Router();

// Lấy danh sách toàn bộ loại phòng
// Dùng cache: thời gian lưu (TTL) là 6 giờ = 21600s
router.get(
    '/',
    withCache('customer:discover:room-types:all', 21600),
    customerRoomTypeController.getAllRoomTypes.bind(customerRoomTypeController)
);

export default router;

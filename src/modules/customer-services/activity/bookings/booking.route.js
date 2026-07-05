import express from 'express';
import customerBookingController from './booking.controller.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { withUserCache } from '../../../../shared/middlewares/cache.middleware.js';

const router = express.Router();

// TTL: 60 giây — đủ để giảm tải DB, nhưng không quá cũ khi booking thay đổi
const BOOKING_CACHE_TTL = 60;

// [GET] Lấy toàn bộ lịch sử đặt phòng của người dùng — Bắt buộc ĐĂNG NHẬP
router.get(
    '/',
    verifyToken,
    withUserCache('customer:activity:bookings', BOOKING_CACHE_TTL),
    customerBookingController.getMyBookings.bind(customerBookingController)
);

// [GET] Lấy chi tiết một đặt phòng theo ID — Bắt buộc ĐĂNG NHẬP
// Cache key theo cả customer_id + booking_id thông qua prefix động
router.get(
    '/:bookingId',
    verifyToken,
    (req, res, next) => {
        // Tạo prefix riêng cho từng booking
        const keyPrefix = `customer:activity:booking:${req.params.bookingId}`;
        return withUserCache(keyPrefix, BOOKING_CACHE_TTL)(req, res, next);
    },
    customerBookingController.getBookingDetail.bind(customerBookingController)
);

export default router;


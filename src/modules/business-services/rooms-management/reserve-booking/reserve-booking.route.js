import express from 'express';
import {
    getReservedBookingsByRoom,
    updateReservedBookingTime,
    deleteReservedBooking,
    convertReservedToRented,
} from './reserve-booking.controller.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { cacheGet, cacheSet } from '../../../../shared/services/cache.service.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

router.use(verifyToken);

// [GET] Lấy danh sách lịch đặt trước của 1 phòng — Cache 30 giây (VERY_SHORT)
// Cache key động bao gồm roomDetailId để tránh trả nhầm dữ liệu giữa các phòng khác nhau
router.get('/by-room/:roomDetailId', async (req, res, next) => {
    const { roomDetailId } = req.params;
    const cacheKey = `reserve-bookings:by-room:${roomDetailId}`;
    try {
        const cached = await cacheGet(cacheKey);
        if (cached !== null) {
            return res.status(200).json({ success: true, message: 'Thành công', data: cached, _cached: true });
        }
        // Cache MISS: intercept rồi đi tiếp vào controller
        const originalJson = res.json.bind(res);
        res.json = async (body) => {
            if (body?.success === true && body?.data !== undefined) {
                await cacheSet(cacheKey, body.data, TTL.VERY_SHORT);
            }
            return originalJson(body);
        };
        next();
    } catch (err) {
        console.warn('[RESERVE-BOOKING CACHE] Lỗi:', err.message);
        next(); // Nếu cache lỗi → vẫn cho request đi tiếp bình thường
    }
}, getReservedBookingsByRoom);

// [PUT] Cập nhật giờ nhận/trả phòng dự kiến (không cache)
router.put('/:bookingId', updateReservedBookingTime);

// [DELETE] Xóa lịch đặt trước (không cache)
router.delete('/:bookingId', deleteReservedBooking);

// [POST] Chuyển RESERVED → RENTED khi admin nhận phòng (không cache)
router.post('/:bookingId/convert', convertReservedToRented);

export default router;

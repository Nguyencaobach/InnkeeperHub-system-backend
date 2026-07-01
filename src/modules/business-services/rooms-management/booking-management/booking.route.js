import express from 'express';
import { createBooking, getActiveBookingByRoom, updateBooking, checkoutBooking } from './booking.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { uploadCCCDImage } from '../../../../shared/middlewares/upload.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { bookingSchema, updateBookingSchema } from './booking.validation.js';
import { withCache, invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../../shared/services/cache.service.js';

const router = express.Router();

router.use(verifyToken);

// [POST] Tạo phiên thuê mới
router.post('/', 
    // 1. Nhận tối đa 2 file (mặt trước, mặt sau)
    uploadCCCDImage.fields([
        { name: 'cccd_front', maxCount: 1 },
        { name: 'cccd_back', maxCount: 1 }
    ]), 
    // 2. Validate dữ liệu text (Form Data)
    validateData(bookingSchema),
    // 3. Xóa cache sau khi tạo
    async (req, res, next) => {
        res.on('finish', () => { 
            if (res.statusCode < 400) {
                invalidateCache('bookings:*', 'customer:*bookings:*');
                invalidateCache('room-details:*', 'customer:*room-details:*');
            }
        });
        next();
    },
    // 4. Xử lý logic
    createBooking
);

// [GET] Lấy phiên thuê đang active theo room_detail_id — Cache 2 phút
router.get('/by-room/:roomDetailId', withCache(`bookings:by-room`, TTL.SHORT), getActiveBookingByRoom);

// [PUT] Cập nhật thông tin phiên thuê
router.put('/:id', validateData(updateBookingSchema), async (req, res, next) => {
    res.on('finish', () => { 
        if (res.statusCode < 400) {
            invalidateCache('bookings:*', 'customer:*bookings:*');
            invalidateCache('room-details:*', 'customer:*room-details:*');
        }
    });
    next();
}, updateBooking);

// [PATCH] Thanh toán & Trả phòng
router.patch('/:id/checkout', async (req, res, next) => {
    res.on('finish', () => { 
        if (res.statusCode < 400) {
            invalidateCache('bookings:*', 'customer:*bookings:*');
            invalidateCache('room-details:*', 'customer:*room-details:*');
        }
    });
    next();
}, checkoutBooking);

export default router;
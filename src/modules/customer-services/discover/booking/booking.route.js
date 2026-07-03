import express from 'express';
import { createBooking, checkPaymentStatus, getRoomAvailability, uploadCCCDForBooking, cancelBooking } from './booking.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { uploadCCCDForReservedImage } from '../../../../shared/middlewares/upload.middleware.js';
import { customerBookingSchema } from './booking.validation.js';

const router = express.Router();

// Bắt buộc khách hàng phải đăng nhập (yêu cầu JWT)
router.use(verifyToken);

// [POST] Tạo phiên đặt phòng và link thanh toán PayOS
router.post('/', validateData(customerBookingSchema), createBooking);

// [GET] Kiểm tra trạng thái thanh toán của booking
router.get('/:id/payment-status', checkPaymentStatus);

// [DELETE] Hủy giao dịch đặt phòng
router.delete('/:id/cancel', cancelBooking);

// [GET] Lấy danh sách lịch bận của một phòng cụ thể
router.get('/availability/:room_detail_id', getRoomAvailability);

// [POST] Upload ảnh CCCD dành cho khách lúc booking (tạm thời)
router.post('/upload-cccd', uploadCCCDForReservedImage.fields([
    { name: 'cccd_front', maxCount: 1 },
    { name: 'cccd_back', maxCount: 1 }
]), uploadCCCDForBooking);

export default router;

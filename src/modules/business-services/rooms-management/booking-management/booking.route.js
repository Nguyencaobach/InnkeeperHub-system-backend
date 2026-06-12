import express from 'express';
import { createBooking } from './booking.controller.js';
import { validateData } from '../../../../shared/middlewares/validation.middleware.js';
import { uploadCCCDImage } from '../../../../shared/middlewares/upload.middleware.js';
import { verifyToken } from '../../../../shared/middlewares/auth.middleware.js';
import { bookingSchema } from './booking.validation.js';

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
    // 3. Xử lý logic
    createBooking
);

export default router;
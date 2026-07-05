import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    uploadCustomerAvatar,
    updateCustomerCCCD,
    getMyPaymentHistory
} from './profile.controller.js';

import { updateProfileSchema } from './profile.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { uploadCustomerAvatar as uploadAvatarMiddleware, uploadCCCDImage } from '../../../shared/middlewares/upload.middleware.js';
import { withUserCache } from '../../../shared/middlewares/cache.middleware.js';

const router = express.Router();

// Bắt buộc khách hàng phải đăng nhập
router.use(verifyToken);

// [GET] Lấy thông tin cá nhân hiện tại — Cache 5 phút, key theo user
router.get('/profile', withUserCache('customer:profile', 300), getMyProfile);

// [PUT] Cập nhật thông tin (Tên, SDT, Email)
router.put('/profile', validateData(updateProfileSchema), updateMyProfile);

// [POST] Upload ảnh đại diện
router.post('/avatar', uploadAvatarMiddleware.single('avatar'), uploadCustomerAvatar);

// [POST] Upload ảnh CCCD mặt trước/sau
router.post('/cccd', uploadCCCDImage.fields([
    { name: 'cccd_front', maxCount: 1 },
    { name: 'cccd_back', maxCount: 1 }
]), updateCustomerCCCD);

// [GET] Lịch sử thanh toán — Cache 2 phút, key theo user
router.get('/payment-history', withUserCache('customer:payment-history', 120), getMyPaymentHistory);

export default router;

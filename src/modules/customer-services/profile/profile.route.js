import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    uploadCustomerAvatar,
    updateCustomerCCCD
} from './profile.controller.js';
import { updateProfileSchema } from './profile.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { uploadCustomerAvatar as uploadAvatarMiddleware, uploadCCCDImage } from '../../../shared/middlewares/upload.middleware.js';

const router = express.Router();

// Bắt buộc khách hàng phải đăng nhập
router.use(verifyToken);

// [GET] Lấy thông tin cá nhân hiện tại
router.get('/profile', getMyProfile);

// [PUT] Cập nhật thông tin (Tên, SDT, Email)
router.put('/profile', validateData(updateProfileSchema), updateMyProfile);

// [POST] Upload ảnh đại diện
router.post('/avatar', uploadAvatarMiddleware.single('avatar'), uploadCustomerAvatar);

// [POST] Upload ảnh CCCD mặt trước/sau
router.post('/cccd', uploadCCCDImage.fields([
    { name: 'cccd_front', maxCount: 1 },
    { name: 'cccd_back', maxCount: 1 }
]), updateCustomerCCCD);

export default router;

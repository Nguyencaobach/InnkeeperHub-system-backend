import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    uploadCustomerAvatar
} from './profile.controller.js';
import { updateProfileSchema } from './profile.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { uploadCustomerAvatar as uploadAvatarMiddleware } from '../../../shared/middlewares/upload.middleware.js';

const router = express.Router();

// Bắt buộc khách hàng phải đăng nhập
router.use(verifyToken);

// [GET] Lấy thông tin cá nhân hiện tại
router.get('/profile', getMyProfile);

// [PUT] Cập nhật thông tin (Tên, SDT, Email)
router.put('/profile', validateData(updateProfileSchema), updateMyProfile);

// [POST] Upload ảnh đại diện
router.post('/avatar', uploadAvatarMiddleware.single('avatar'), uploadCustomerAvatar);

export default router;

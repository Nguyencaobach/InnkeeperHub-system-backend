import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    getBusinessSettings,
    updateBusinessSettings,
} from './profile.controller.js';
import { updateProfileSchema, updateBusinessSchema } from './profile.validation.js';
import { validateData } from '../../../shared/middlewares/validation.middleware.js';
import { verifyToken } from '../../../shared/middlewares/auth.middleware.js';
import { requireRole } from '../../../shared/middlewares/role.middleware.js';
import { uploadAvatarImage } from '../../../shared/middlewares/upload.middleware.js';

const router = express.Router();

// Tất cả các route đều yêu cầu đăng nhập
router.use(verifyToken);

// =============================================
// HỒ SƠ CÁ NHÂN — mọi role đều được truy cập
// =============================================
router.get('/me', getMyProfile);
router.put('/me', validateData(updateProfileSchema), updateMyProfile);
router.post('/avatar', uploadAvatarImage.single('avatar'), uploadAvatar);

// =============================================
// THÔNG TIN DOANH NGHIỆP — chỉ ADMIN
// =============================================
router.get('/business', requireRole(['ADMIN']), getBusinessSettings);
router.put('/business', requireRole(['ADMIN']), validateData(updateBusinessSchema), updateBusinessSettings);

export default router;

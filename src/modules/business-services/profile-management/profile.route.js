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
import { withCache, invalidateCache } from '../../../shared/middlewares/cache.middleware.js';
import { TTL } from '../../../shared/services/cache.service.js';

const router = express.Router();

// Tất cả các route đều yêu cầu đăng nhập
router.use(verifyToken);

// =============================================
// HỒ SƠ CÁ NHÂN — mọi role đều được truy cập
// =============================================

// [GET] Profile cá nhân — Cache 15 phút
router.get('/me', withCache('profile:me', TTL.LONG), getMyProfile);

// [PUT] Cập nhật profile → Xóa cache
router.put('/me', validateData(updateProfileSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('profile:*'); });
    next();
}, updateMyProfile);

// [POST] Upload avatar → Xóa cache
router.post('/avatar', uploadAvatarImage.single('avatar'), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('profile:*'); });
    next();
}, uploadAvatar);

// =============================================
// THÔNG TIN DOANH NGHIỆP — chỉ ADMIN
// =============================================

// [GET] Thông tin doanh nghiệp — Cache 15 phút
router.get('/business', requireRole(['ADMIN']), withCache('profile:business', TTL.LONG), getBusinessSettings);

// [PUT] Cập nhật doanh nghiệp → Xóa cache
router.put('/business', requireRole(['ADMIN']), validateData(updateBusinessSchema), async (req, res, next) => {
    res.on('finish', () => { if (res.statusCode < 400) invalidateCache('profile:*'); });
    next();
}, updateBusinessSettings);

export default router;

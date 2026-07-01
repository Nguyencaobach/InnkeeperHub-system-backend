import {
    getProfileLogic,
    updateProfileLogic,
    uploadAvatarLogic,
    getBusinessSettingsLogic,
    upsertBusinessSettingsLogic,
} from './profile.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { logActivity } from '../../../shared/utils/activity.helper.js';
import { invalidateCache } from '../../../shared/middlewares/cache.middleware.js';

// =============================================
// HỒ SƠ CÁ NHÂN
// =============================================

/**
 * GET /api/profile/me
 * Lấy thông tin hồ sơ của user đang đăng nhập
 */
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await getProfileLogic(userId);
        return sendSuccess(res, result, 'Lấy thông tin hồ sơ thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

/**
 * PUT /api/profile/me
 * Cập nhật hồ sơ cá nhân của user đang đăng nhập
 */
export const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await updateProfileLogic(userId, req.body);
        logActivity(req.user, 'UPDATE', 'Hồ sơ cá nhân', result.full_name || result.username);
        await invalidateCache('profile:*');
        return sendSuccess(res, result, 'Cập nhật hồ sơ thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

/**
 * POST /api/profile/avatar
 * Upload ảnh avatar của user đang đăng nhập
 */
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'Vui lòng chọn ảnh để upload.', STATUS_CODES.BAD_REQUEST);
        }
        const userId = req.user.user_id;
        const result = await uploadAvatarLogic(userId, req.file);
        logActivity(req.user, 'UPDATE', 'Avatar', req.user.username);
        await invalidateCache('profile:*');
        return sendSuccess(res, result, 'Cập nhật avatar thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

// =============================================
// THÔNG TIN DOANH NGHIỆP (chỉ ADMIN)
// =============================================

/**
 * GET /api/profile/business
 * Lấy thông tin doanh nghiệp — chỉ ADMIN
 */
export const getBusinessSettings = async (req, res) => {
    try {
        const result = await getBusinessSettingsLogic();
        return sendSuccess(res, result, 'Lấy thông tin doanh nghiệp thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

/**
 * PUT /api/profile/business
 * Tạo mới / cập nhật thông tin doanh nghiệp — chỉ ADMIN
 */
export const updateBusinessSettings = async (req, res) => {
    try {
        const result = await upsertBusinessSettingsLogic(req.body);
        logActivity(req.user, 'UPDATE', 'Thông tin doanh nghiệp', result.business_name);
        await invalidateCache('profile:*');
        return sendSuccess(res, result, 'Cập nhật thông tin doanh nghiệp thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

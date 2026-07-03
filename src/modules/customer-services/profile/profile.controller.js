import {
    getProfileLogic,
    updateProfileLogic,
    uploadAvatarLogic,
    updateCCCDLogic
} from './profile.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../shared/middlewares/cache.middleware.js';

export const getMyProfile = async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const result = await getProfileLogic(customerId);
        return sendSuccess(res, result, 'Lấy thông tin hồ sơ thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const result = await updateProfileLogic(customerId, req.body);
        
        await invalidateCache(`customer:profile:${customerId}`);
        
        return sendSuccess(res, result, 'Cập nhật thông tin thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const uploadCustomerAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'Vui lòng chọn ảnh upload.', STATUS_CODES.BAD_REQUEST);
        }
        const customerId = req.user.customer_id;
        const result = await uploadAvatarLogic(customerId, req.file);
        
        await invalidateCache(`customer:profile:${customerId}`);
        
        return sendSuccess(res, result, 'Cập nhật ảnh đại diện thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const updateCustomerCCCD = async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const files = req.files;

        if (!files || (!files['cccd_front'] && !files['cccd_back'])) {
            return sendError(res, 'Vui lòng chọn ảnh mặt trước hoặc mặt sau CCCD.', STATUS_CODES.BAD_REQUEST);
        }

        let frontUrl = null;
        let backUrl = null;

        if (files['cccd_front'] && files['cccd_front'].length > 0) {
            frontUrl = `/uploads/cccd/${files['cccd_front'][0].filename}`;
        }
        
        if (files['cccd_back'] && files['cccd_back'].length > 0) {
            backUrl = `/uploads/cccd/${files['cccd_back'][0].filename}`;
        }

        const result = await updateCCCDLogic(customerId, frontUrl, backUrl);
        
        await invalidateCache(`customer:profile:${customerId}`);
        
        return sendSuccess(res, result, 'Cập nhật CCCD thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

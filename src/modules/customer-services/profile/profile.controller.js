import {
    getProfileLogic,
    updateProfileLogic,
    uploadAvatarLogic,
    updateCCCDLogic,
    getPaymentHistoryLogic
} from './profile.service.js';

import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../shared/middlewares/cache.middleware.js';
import { verifyCCCDImage } from '../../../shared/services/aiverify.service.js';
import fs from 'fs';
import path from 'path';

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

// Hàm phụ: Xóa file tạm khi ảnh không hợp lệ
const _deleteUploadedFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (_) { /* ignore */ }
};

export const updateCustomerCCCD = async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const files = req.files;
        // Lấy tên user để Python đối chiếu với tên trên CCCD
        const userName = req.user.full_name || req.user.name || '';

        if (!files || (!files['cccd_front'] && !files['cccd_back'])) {
            return sendError(res, 'Vui lòng chọn ảnh mặt trước hoặc mặt sau CCCD.', STATUS_CODES.BAD_REQUEST);
        }

        let frontUrl = null;
        let backUrl = null;

        // ─── XÁC THỰC ẢNH MẶT TRƯỚC VỚI AI SERVER ───────────────────
        if (files['cccd_front'] && files['cccd_front'].length > 0) {
            const frontFile = files['cccd_front'][0];
            const frontPath = path.join(process.cwd(), 'public', 'uploads', 'cccd', frontFile.filename);

            const frontVerify = await verifyCCCDImage(frontPath, 'front', userName);
            if (!frontVerify.valid) {
                // Xóa file tạm
                _deleteUploadedFile(frontPath);
                // Xóa luôn file mặt sau nếu có
                if (files['cccd_back'] && files['cccd_back'].length > 0) {
                    _deleteUploadedFile(path.join(process.cwd(), 'public', 'uploads', 'cccd', files['cccd_back'][0].filename));
                }
                return sendError(res, frontVerify.message, STATUS_CODES.BAD_REQUEST);
            }

            frontUrl = `/uploads/cccd/${frontFile.filename}`;
        }

        // ─── XÁC THỰC ẢNH MẶT SAU VỚI ZALO AI ─────────────────────
        if (files['cccd_back'] && files['cccd_back'].length > 0) {
            const backFile = files['cccd_back'][0];
            const backPath = path.join(process.cwd(), 'public', 'uploads', 'cccd', backFile.filename);

            const backVerify = await verifyCCCDImage(backPath, 'back');
            if (!backVerify.valid) {
                // Xóa file tạm
                _deleteUploadedFile(backPath);
                // Xóa luôn file mặt trước nếu đã upload nhưng mặt sau sai
                if (frontUrl) {
                    _deleteUploadedFile(path.join(process.cwd(), 'public', frontUrl));
                }
                return sendError(res, backVerify.message, STATUS_CODES.BAD_REQUEST);
            }

            backUrl = `/uploads/cccd/${backFile.filename}`;
        }

        // ─── ẢNH HỢP LỆ → LƯU VÀO DATABASE ───────────────────────
        const result = await updateCCCDLogic(customerId, frontUrl, backUrl);
        
        await invalidateCache(`customer:profile:${customerId}`);
        
        return sendSuccess(res, result, 'Cập nhật CCCD thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getMyPaymentHistory = async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const history = await getPaymentHistoryLogic(customerId);
        return sendSuccess(res, history, 'Lấy lịch sử thanh toán thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

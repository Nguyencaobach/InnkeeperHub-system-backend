import { loginLogic } from './auth.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { logActivity } from '../../../shared/utils/activity.helper.js';
import { cacheSet } from '../../../shared/services/cache.service.js';
import jwt from 'jsonwebtoken';

export const loginController = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await loginLogic(username, password);

        // Ghi log đăng nhập thành công
        logActivity(result.user, 'LOGIN', 'Tài khoản', result.user.username);

        return sendSuccess(res, result, "Đăng nhập thành công!", STATUS_CODES.OK);
        
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

// ============================================================
// POST /api/auth/logout
// Đưa token vào blacklist Redis → token bị vô hiệu ngay lập tức
// dù chưa hết hạn 1 ngày
// ============================================================
export const logoutController = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (token) {
            // Giải mã để biết token còn sống bao lâu
            const secretKey = process.env.JWT_SECRET || 'chuoi_bi_mat_cuc_ky_kho_doan';
            const decoded = jwt.decode(token);

            if (decoded?.exp) {
                // TTL = số giây còn lại đến khi token hết hạn
                const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttlSeconds > 0) {
                    // Lưu token vào blacklist với TTL vừa đủ → Redis tự xóa khi token hết hạn
                    await cacheSet(`blacklist:${token}`, '1', ttlSeconds);
                }
            }

            // Ghi log đăng xuất
            if (req.user) {
                logActivity(req.user, 'LOGOUT', 'Tài khoản', req.user.username);
            }
        }

        return sendSuccess(res, null, "Đăng xuất thành công!", STATUS_CODES.OK);

    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};
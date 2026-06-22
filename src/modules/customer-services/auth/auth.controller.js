import {
    registerLogic,
    loginLogic,
    forgotPasswordLogic,
} from './auth.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';

// ============================================================
// POST /api/customer-auth/register
// ============================================================
export const registerController = async (req, res) => {
    try {
        const { username, password, full_name, email, phone_number } = req.body;
        const newCustomer = await registerLogic({ username, password, full_name, email, phone_number });

        return sendSuccess(res, newCustomer, 'Đăng ký tài khoản thành công!', STATUS_CODES.CREATED);
    } catch (error) {
        // Trùng lặp dữ liệu → 409 Conflict
        const isConflict = error.message.includes('đã được sử dụng') || error.message.includes('đã được đăng ký');
        const statusCode = isConflict ? STATUS_CODES.CONFLICT : STATUS_CODES.BAD_REQUEST;
        return sendError(res, error.message, statusCode);
    }
};

// ============================================================
// POST /api/customer-auth/login
// ============================================================
export const loginController = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await loginLogic(username, password);

        return sendSuccess(res, result, 'Đăng nhập thành công!', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

// ============================================================
// POST /api/customer-auth/forgot-password
// ============================================================
export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordLogic(email);

        return sendSuccess(res, null, result.message, STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

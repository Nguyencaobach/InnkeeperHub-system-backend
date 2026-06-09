import { loginLogic } from './auth.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { logActivity } from '../../../shared/utils/activity.helper.js';

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
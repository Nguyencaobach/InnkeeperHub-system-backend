import { loginLogic } from './auth.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';

export const loginController = async (req, res) => {
    try {
        // Lấy username và password từ body (đã qua bước lọc của Joi)
        const { username, password } = req.body;

        // Gọi hàm xử lý logic
        const result = await loginLogic(username, password);

        // Trả về Frontend
        return sendSuccess(res, result, "Đăng nhập thành công!", STATUS_CODES.OK);
        
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
import { findUserByUsername } from './auth.model.js';
import { comparePassword } from '../../../shared/utils/hash.util.js';
import { generateToken } from '../../../shared/utils/jwt.util.js';

export const loginLogic = async (username, password) => {
    // 1. Tìm user trong Database
    const user = await findUserByUsername(username);
    
    // Báo lỗi gộp chung để hacker không biết là sai username hay tài khoản bị khóa
    if (!user) {
        throw new Error("Tài khoản không tồn tại hoặc đã bị khóa.");
    }

    // 2. So sánh mật khẩu khách gửi và mật khẩu dưới DB
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
        throw new Error("Mật khẩu không chính xác.");
    }

    // 3. Nếu đúng hết, tạo vé Token (Sử dụng user_id kiểu UUID của bạn)
    const token = generateToken({ id: user.user_id, role: user.role });

    // 4. Trả kết quả (Xóa bỏ password trước khi gửi ra ngoài Frontend)
    const { password: userPass, ...userInfo } = user;
    
    return {
        user: userInfo,
        accessToken: token
    };
};
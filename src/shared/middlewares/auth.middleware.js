import jwt from 'jsonwebtoken';
import { sendError, STATUS_CODES } from '../utils/response.util.js';
import { cacheExists } from '../services/cache.service.js';

export const verifyToken = async (req, res, next) => {
    try {
        // 1. Lấy token từ header (Frontend sẽ gửi lên dưới dạng: 'Authorization: Bearer <token>')
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, "Không tìm thấy Token xác thực. Vui lòng đăng nhập!", STATUS_CODES.UNAUTHORIZED);
        }

        // Cắt lấy phần <token> nằm sau chữ 'Bearer '
        const token = authHeader.split(' ')[1];

        // 2. Lấy chìa khóa bí mật (Phải giống hệt chìa khóa bên file jwt.util.js lúc tạo token)
        const secretKey = process.env.JWT_SECRET || 'chuoi_bi_mat_cuc_ky_kho_doan';

        // 3. Giải mã và kiểm tra token
        const decoded = jwt.verify(token, secretKey);

        // 4. Kiểm tra token có trong danh sách blacklist (đã logout) không
        // Key trong Redis được lưu lúc logout: "blacklist:<token>"
        const isBlacklisted = await cacheExists(`blacklist:${token}`);
        if (isBlacklisted) {
            return sendError(res, "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại!", STATUS_CODES.UNAUTHORIZED);
        }

        // 5. Lưu thông tin user (gồm id, role...) vào req để các Controller phía sau có thể dùng
        // Ví dụ: Controller tạo hóa đơn cần biết nhân viên nào tạo, nó chỉ cần gọi req.user.id
        req.user = decoded;

        // 6. Mọi thứ hợp lệ -> Mở cổng cho đi tiếp vào Controller
        next();

    } catch (error) {
        // Bắt lỗi chi tiết để Frontend biết đường xử lý
        if (error.name === 'TokenExpiredError') {
            return sendError(res, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!", STATUS_CODES.UNAUTHORIZED);
        }
        return sendError(res, "Token không hợp lệ hoặc đã bị chỉnh sửa!", STATUS_CODES.UNAUTHORIZED);
    }
};
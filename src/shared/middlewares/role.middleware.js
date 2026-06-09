import { sendError, STATUS_CODES } from '../utils/response.util.js';

/**
 * Middleware Phân quyền người dùng (Role-based Access Control)
 * @param {Array} allowedRoles - Mảng chứa danh sách các Role được phép truy cập (VD: ['ADMIN', 'MANAGER'])
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Lấy thông tin role từ req.user (Biến này đã được tạo ra bởi middleware verifyToken chạy trước đó)
            const userRole = req.user?.role;

            // Kiểm tra xem user có tồn tại role không, và role đó có nằm trong danh sách được phép không
            if (!userRole || !allowedRoles.includes(userRole)) {
                return sendError(
                    res, 
                    "Truy cập bị từ chối. Chức vụ của bạn không có quyền thực hiện thao tác này.", 
                    STATUS_CODES.FORBIDDEN || 403
                );
            }

            // Đã kiểm tra hợp lệ -> Cho phép đi tiếp vào Controller
            next();
            
        } catch (error) {
            console.error("Lỗi Middleware Phân quyền:", error);
            return sendError(res, "Lỗi hệ thống khi xác thực phân quyền.", STATUS_CODES.INTERNAL_ERROR || 500);
        }
    };
};
import { insertLog } from '../../modules/business-services/account-activity/account_activity.model.js';

/**
 * Ghi nhật ký hoạt động — Fire-and-forget (không throw lỗi để không ảnh hưởng API chính)
 *
 * @param {object} user   - req.user từ verifyToken (có thể null với login)
 * @param {string} action - Loại hành động: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE'
 * @param {string} entityType - Tên loại đối tượng: 'Sản phẩm' | 'Nhân viên' | 'Khách hàng'...
 * @param {string} entityName - Tên cụ thể của đối tượng (VD: tên sản phẩm, tên nhân viên)
 * @param {object} [details] - Thông tin bổ sung tuỳ ý (object)
 */
export const logActivity = async (user, action, entityType = null, entityName = null, details = null) => {
    try {
        // Gộp role vào details để frontend hiển thị badge vai trò
        const enrichedDetails = user?.role
            ? { role: user.role, ...(details || {}) }
            : details;

        await insertLog({
            user_id:     user?.user_id || user?.id || null,
            username:    user?.full_name || user?.username || null, // Ưu tiên tên đầy đủ
            action,
            entity_type: entityType,
            entity_name: entityName,
            details:     enrichedDetails,
        });
    } catch (err) {
        // Chỉ in ra console, không throw — log thất bại không được làm hỏng API chính
        console.error('[ActivityLog] Lỗi ghi nhật ký:', err.message);
    }
};

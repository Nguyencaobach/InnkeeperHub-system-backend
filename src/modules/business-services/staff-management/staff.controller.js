import { createLogic, getListLogic, updateLogic, deleteLogic, hardDeleteLogic } from './staff.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { logActivity } from '../../../shared/utils/activity.helper.js';
import { invalidateCache } from '../../../shared/middlewares/cache.middleware.js';

export const createStaff = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        logActivity(req.user, 'CREATE', 'Nhân viên', result.full_name || result.username);
        await invalidateCache('staff:*');
        return sendSuccess(res, result, "Thêm mới nhân viên thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllStaff = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách nhân viên thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserRole = req.user.role;
        const result = await updateLogic(id, req.body, currentUserRole);
        logActivity(req.user, 'UPDATE', 'Nhân viên', result.full_name || result.username);
        await invalidateCache('staff:*');
        return sendSuccess(res, result, "Cập nhật thông tin nhân viên thành công", STATUS_CODES.OK);
    } catch (error) {
        const statusCode = error.message.includes("Từ chối truy cập") ? STATUS_CODES.FORBIDDEN : STATUS_CODES.BAD_REQUEST;
        return sendError(res, error.message, statusCode);
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteLogic(id);
        logActivity(req.user, 'DELETE', 'Nhân viên', result?.full_name || `ID: ${id}`);
        await invalidateCache('staff:*');
        return sendSuccess(res, null, "Đã khóa tài khoản nhân viên thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const hardDeleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await hardDeleteLogic(id);
        logActivity(req.user, 'DELETE', 'Nhân viên', result?.full_name || `ID: ${id}`);
        await invalidateCache('staff:*');
        return sendSuccess(res, null, "Đã xóa vĩnh viễn nhân viên thành công", STATUS_CODES.OK);
    } catch (error) {
        // Kiểm tra mã lỗi foreign key constraint của PostgreSQL (23503)
        if (error.code === '23503') {
            return sendError(res, "Không thể xóa vĩnh viễn nhân viên này do đã có dữ liệu giao dịch/lịch sử liên kết. Vui lòng sử dụng tính năng Khóa tài khoản.", STATUS_CODES.BAD_REQUEST);
        }
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
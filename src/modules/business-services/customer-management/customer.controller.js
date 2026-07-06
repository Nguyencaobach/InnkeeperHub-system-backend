import { createLogic, getListLogic, updateLogic, deleteLogic, hardDeleteLogic } from './customer.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { logActivity } from '../../../shared/utils/activity.helper.js';
import { invalidateCache } from '../../../shared/middlewares/cache.middleware.js';

export const createCustomer = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        logActivity(req.user, 'CREATE', 'Khách hàng', result.full_name || result.phone_number);
        await invalidateCache('customers:*', 'customer:*customers:*');
        return sendSuccess(res, result, "Thêm mới khách hàng thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllCustomers = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách khách hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body);
        logActivity(req.user, 'UPDATE', 'Khách hàng', result.full_name || result.phone_number);
        await invalidateCache('customers:*', 'customer:*customers:*');
        return sendSuccess(res, result, "Cập nhật thông tin khách hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteLogic(id);
        logActivity(req.user, 'DELETE', 'Khách hàng', result?.full_name || `ID: ${id}`);
        await invalidateCache('customers:*', 'customer:*customers:*');
        return sendSuccess(res, null, "Đã khóa tài khoản khách hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const hardDeleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await hardDeleteLogic(id);
        logActivity(req.user, 'DELETE', 'Khách hàng', result?.full_name || `ID: ${id}`);
        await invalidateCache('customers:*', 'customer:*customers:*');
        return sendSuccess(res, null, "Đã xóa vĩnh viễn khách hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        // Kiểm tra mã lỗi foreign key constraint của PostgreSQL (23503)
        if (error.code === '23503') {
            return sendError(res, "Không thể xóa vĩnh viễn khách hàng này do đã có dữ liệu giao dịch/hóa đơn liên kết. Vui lòng sử dụng tính năng Khóa tài khoản.", STATUS_CODES.BAD_REQUEST);
        }
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
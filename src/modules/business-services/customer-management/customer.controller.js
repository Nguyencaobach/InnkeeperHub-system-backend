import { createLogic, getListLogic, updateLogic, deleteLogic } from './customer.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';

export const createCustomer = async (req, res) => {
    try {
        const result = await createLogic(req.body);
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
        return sendSuccess(res, result, "Cập nhật thông tin khách hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Đã khóa tài khoản khách hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
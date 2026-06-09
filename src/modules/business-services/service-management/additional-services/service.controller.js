import { createLogic, getListLogic, updateLogic, deleteLogic } from './service.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { logActivity } from '../../../../shared/utils/activity.helper.js';

export const createService = async (req, res) => {
    try {
        const result = await createLogic(req.body, req.file);
        logActivity(req.user, 'CREATE', 'Dịch vụ', result.name);
        return sendSuccess(res, result, "Thêm dịch vụ thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllServices = async (req, res) => {
    try {
        // Có thể nhận category từ URL: /api/services?category=LAUNDRY
        const { category } = req.query;
        const result = await getListLogic(category);
        return sendSuccess(res, result, "Lấy danh sách dịch vụ thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body, req.file);
        logActivity(req.user, 'UPDATE', 'Dịch vụ', result.name);
        return sendSuccess(res, result, "Cập nhật dịch vụ thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteLogic(id);
        logActivity(req.user, 'DELETE', 'Dịch vụ', result?.name || `ID: ${id}`);
        return sendSuccess(res, null, "Xóa dịch vụ thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
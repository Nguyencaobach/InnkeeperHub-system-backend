import { createLogic, getListLogic, updateLogic, deleteLogic } from './discount.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

export const createDiscount = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        return sendSuccess(res, result, "Tạo mã giảm giá thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllDiscounts = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách mã giảm giá thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body);
        return sendSuccess(res, result, "Cập nhật mã giảm giá thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Xóa mã giảm giá thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
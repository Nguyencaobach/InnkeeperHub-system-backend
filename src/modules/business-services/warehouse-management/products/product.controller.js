import { createLogic, getListLogic, updateLogic, deleteLogic } from './product.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

export const createProduct = async (req, res) => {
    try {
        const result = await createLogic(req.body, req.file);
        return sendSuccess(res, result, "Thêm sản phẩm thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách sản phẩm thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body, req.file);
        return sendSuccess(res, result, "Cập nhật sản phẩm thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Xóa sản phẩm thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
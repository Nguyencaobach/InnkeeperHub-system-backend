import { createLogic, getListLogic, updateLogic, deleteLogic } from './category.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

export const createCategory = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        return sendSuccess(res, result, "Thêm mới danh mục thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách danh mục thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body);
        return sendSuccess(res, result, "Cập nhật danh mục thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Xóa danh mục thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
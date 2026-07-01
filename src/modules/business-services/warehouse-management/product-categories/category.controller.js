import { createLogic, getListLogic, updateLogic, deleteLogic } from './category.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { logActivity } from '../../../../shared/utils/activity.helper.js';
import { invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';

export const createCategory = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        logActivity(req.user, 'CREATE', 'Danh mục kho', result.name);
        await invalidateCache('product-categories:*', 'customer:*product-categories:*');
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
        logActivity(req.user, 'UPDATE', 'Danh mục kho', result.name);
        await invalidateCache('product-categories:*', 'customer:*product-categories:*');
        return sendSuccess(res, result, "Cập nhật danh mục thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteLogic(id);
        logActivity(req.user, 'DELETE', 'Danh mục kho', result?.name || `ID: ${id}`);
        await invalidateCache('product-categories:*', 'customer:*product-categories:*');
        return sendSuccess(res, null, "Xóa danh mục thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
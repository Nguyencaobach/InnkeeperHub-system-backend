import { createLogic, getListLogic, updateLogic, deleteLogic } from './product-batch.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

export const createBatch = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        return sendSuccess(res, result, "Thêm lô hàng thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getBatches = async (req, res) => {
    try {
        // Lấy danh sách lô hàng dựa vào product_id truyền trên thanh URL (query)
        // Ví dụ: GET /api/product-batches?product_id=123-abc
        const { product_id } = req.query; 
        const result = await getListLogic(product_id);
        return sendSuccess(res, result, "Lấy danh sách lô hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body);
        return sendSuccess(res, result, "Cập nhật lô hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Xóa lô hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
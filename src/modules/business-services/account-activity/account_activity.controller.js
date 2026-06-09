import { createLogic, getListLogic, deleteLogsBeforeLogic } from './account_activity.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';

export const createActivityLog = async (req, res) => {
    try {
        // Truyền thêm req.user (được tạo ra từ middleware verifyToken) vào Service
        const result = await createLogic(req.body, req.user);
        return sendSuccess(res, result, "Ghi log thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllActivityLogs = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        
        const result = await getListLogic(limit, offset);
        return sendSuccess(res, result, "Lấy danh sách nhật ký thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const deleteActivityLogs = async (req, res) => {
    try {
        const { beforeDate } = req.params;
        if (!beforeDate) {
            return sendError(res, 'Vui lòng cung cấp ngày (beforeDate).', STATUS_CODES.BAD_REQUEST);
        }
        const result = await deleteLogsBeforeLogic(beforeDate);
        return sendSuccess(
            res,
            result,
            `Đã xóa ${result.deletedCount} dòng log trước ngày ${beforeDate}.`,
            STATUS_CODES.OK
        );
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
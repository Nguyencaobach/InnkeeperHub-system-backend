import { createLogic, getListLogic, updateLogic, deleteLogic } from './room_type.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

export const createRoomType = async (req, res) => {
    try {
        const result = await createLogic(req.body, req.file);
        return sendSuccess(res, result, "Tạo loại phòng thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllRoomTypes = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateRoomType = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body, req.file);
        return sendSuccess(res, result, "Cập nhật loại phòng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteRoomType = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Xóa loại phòng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
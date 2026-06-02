import { createLogic, getListLogic, updateLogic, deleteLogic } from './room_detail.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

export const createRoomDetail = async (req, res) => {
    try {
        const result = await createLogic(req.body);
        return sendSuccess(res, result, "Tạo phòng chi tiết thành công", STATUS_CODES.CREATED);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const getAllRoomDetails = async (req, res) => {
    try {
        const result = await getListLogic();
        return sendSuccess(res, result, "Lấy danh sách phòng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const updateRoomDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateLogic(id, req.body);
        return sendSuccess(res, result, "Cập nhật phòng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

export const deleteRoomDetail = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteLogic(id);
        return sendSuccess(res, null, "Xóa phòng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
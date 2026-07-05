import customerRoomService from './room.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { invalidateCache, invalidateUserCache } from '../../../../shared/middlewares/cache.middleware.js';

class CustomerRoomController {
    async getAllRoomTypes(req, res) {
        try {
            const roomTypes = await customerRoomService.getAllRoomTypes();
            return sendSuccess(res, roomTypes, 'Lấy danh sách loại phòng thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[CustomerRoomController] getAllRoomTypes Lỗi:', error);
            return sendError(res, 'Đã xảy ra lỗi khi lấy dữ liệu loại phòng', STATUS_CODES.INTERNAL_ERROR);
        }
    }

    async getRoomsByType(req, res) {
        try {
            const { id } = req.params; // ID của loại phòng
            const rooms = await customerRoomService.getRoomsByType(id);
            return sendSuccess(res, rooms, 'Lấy danh sách phòng thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[CustomerRoomController] getRoomsByType Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // HÀM MỚI: Đánh giá sao
    async rateRoomType(req, res) {
        try {
            const { id } = req.params; // ID của room_type
            const { rating } = req.body; // Số sao từ 1-5
            const customerId = req.user.customer_id; // Lấy ID khách hàng từ token đăng nhập

            const result = await customerRoomService.submitRating(id, customerId, rating);

            // [QUAN TRỌNG]: Xóa cache danh sách loại phòng để cập nhật lại số sao trung bình mới nhất
            await invalidateCache('customer:discover:room-types:*');

            return sendSuccess(res, result, 'Cảm ơn bạn đã đánh giá loại phòng này!', STATUS_CODES.CREATED);
        } catch (error) {
            console.error('[CustomerRoomController] rateRoomType Lỗi:', error);
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    async saveRoom(req, res) {
        try {
            const customerId = req.user.customer_id;
            const roomTypeId = req.params.roomTypeId;
            const result = await customerRoomService.saveRoom(customerId, roomTypeId);
            
            // Xóa cache danh sách phòng đã lưu để lần sau lấy dữ liệu mới
            await invalidateUserCache('customer:saved-rooms', customerId);

            const message = result.already_exists ? 'Phòng đã có trong danh sách lưu của bạn' : 'Đã lưu phòng thành công';
            return sendSuccess(res, result, message, STATUS_CODES.OK);
        } catch (error) {
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    async removeSavedRoom(req, res) {
        try {
            const customerId = req.user.customer_id;
            const roomTypeId = req.params.roomTypeId;
            const success = await customerRoomService.removeSavedRoom(customerId, roomTypeId);
            
            if (success) {
                // Xóa cache danh sách phòng đã lưu
                await invalidateUserCache('customer:saved-rooms', customerId);
                return sendSuccess(res, { success: true }, 'Đã xóa phòng khỏi danh sách lưu', STATUS_CODES.OK);
            } else {
                return sendError(res, 'Phòng không có trong danh sách lưu', STATUS_CODES.BAD_REQUEST);
            }
        } catch (error) {
            return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
        }
    }

    async getMySavedRooms(req, res) {
        try {
            const customerId = req.user.customer_id;
            const savedRooms = await customerRoomService.getSavedRooms(customerId);
            return sendSuccess(res, savedRooms, 'Lấy danh sách phòng đã lưu thành công', STATUS_CODES.OK);
        } catch (error) {
            return sendError(res, error.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
        }
    }
}

export default new CustomerRoomController();

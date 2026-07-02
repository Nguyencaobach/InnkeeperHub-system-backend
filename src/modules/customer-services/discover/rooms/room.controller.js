import customerRoomService from './room.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../../shared/middlewares/cache.middleware.js'; // Import hàm xóa cache

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
}

export default new CustomerRoomController();

import customerRoomTypeService from './room-types.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';

class CustomerRoomTypeController {
    /**
     * @route GET /api/discover/room-types
     * @desc Lấy danh sách toàn bộ loại phòng cho khách hàng
     * @access Public
     */
    async getAllRoomTypes(req, res) {
        try {
            const roomTypes = await customerRoomTypeService.getAllRoomTypes();
            return sendSuccess(res, roomTypes, 'Lấy danh sách loại phòng thành công', STATUS_CODES.OK);
        } catch (error) {
            console.error('[CustomerRoomTypeController] getAllRoomTypes Lỗi:', error);
            return sendError(res, 'Đã xảy ra lỗi khi lấy dữ liệu loại phòng', STATUS_CODES.INTERNAL_ERROR);
        }
    }
}

export default new CustomerRoomTypeController();

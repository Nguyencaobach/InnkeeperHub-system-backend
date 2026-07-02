import roomTypeModel from './room-types.model.js';

class CustomerRoomTypeService {
    async getAllRoomTypes() {
        return await roomTypeModel.getAllRoomTypes();
    }

    async submitRating(roomTypeId, customerId, rating) {
        if (!roomTypeId) throw new Error('Thiếu mã loại phòng.');
        if (!customerId) throw new Error('Thiếu thông tin khách hàng (chưa đăng nhập).');

        // Gọi model lưu xuống CSDL
        return await roomTypeModel.rateRoomType(roomTypeId, customerId, rating);
    }
}

export default new CustomerRoomTypeService();

import roomModel from './room.model.js';

class CustomerRoomService {
    async getAllRoomTypes() {
        return await roomModel.getAllRoomTypes();
    }

    async getRoomsByType(roomTypeId) {
        if (!roomTypeId) throw new Error('Thiếu mã loại phòng.');
        return await roomModel.getRoomsByType(roomTypeId);
    }

    async submitRating(roomTypeId, customerId, rating) {
        if (!roomTypeId) throw new Error('Thiếu mã loại phòng.');
        if (!customerId) throw new Error('Thiếu thông tin khách hàng (chưa đăng nhập).');

        // Gọi model lưu xuống CSDL
        return await roomModel.rateRoomType(roomTypeId, customerId, rating);
    }
}

export default new CustomerRoomService();

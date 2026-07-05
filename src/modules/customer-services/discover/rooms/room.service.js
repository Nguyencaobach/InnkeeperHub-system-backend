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

    async saveRoom(customerId, roomTypeId) {
        if (!roomTypeId) throw new Error('Vui lòng cung cấp ID loại phòng.');
        return await roomModel.saveRoom(customerId, roomTypeId);
    }

    async removeSavedRoom(customerId, roomTypeId) {
        if (!roomTypeId) throw new Error('Vui lòng cung cấp ID loại phòng.');
        return await roomModel.removeSavedRoom(customerId, roomTypeId);
    }

    async getSavedRooms(customerId) {
        return await roomModel.fetchSavedRooms(customerId);
    }
}

export default new CustomerRoomService();

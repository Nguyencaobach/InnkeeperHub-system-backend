import roomTypeModel from './room-types.model.js';

class CustomerRoomTypeService {
    /**
     * Lấy toàn bộ danh sách loại phòng cho khách hàng
     */
    async getAllRoomTypes() {
        const roomTypes = await roomTypeModel.getAllRoomTypes();
        // Trả về trực tiếp mảng dữ liệu
        return roomTypes;
    }
}

export default new CustomerRoomTypeService();

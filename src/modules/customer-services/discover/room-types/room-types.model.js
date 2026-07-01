import pool from '../../../../shared/database/db.js';

class CustomerRoomTypeModel {
    /**
     * Lấy danh sách tất cả các loại phòng
     * Dùng cho khách hàng xem trên app/web
     */
    async getAllRoomTypes() {
        const query = `
            SELECT 
                id,
                name,
                hourly_price,
                daily_price,
                floor,
                capacity,
                bed_type,
                room_size,
                view_type,
                amenities,
                room_img_url
            FROM room_types
            ORDER BY name ASC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default new CustomerRoomTypeModel();

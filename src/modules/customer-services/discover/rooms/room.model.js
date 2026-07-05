import pool from '../../../../shared/database/db.js';

class CustomerRoomModel {
    /**
     * Lấy danh sách tất cả các loại phòng KÈM THEO điểm đánh giá trung bình
     */
    async getAllRoomTypes() {
        const query = `
            SELECT 
                rt.id,
                rt.name,
                rt.hourly_price,
                rt.daily_price,
                rt.floor,
                rt.capacity,
                rt.bed_type,
                rt.room_size,
                rt.view_type,
                rt.amenities,
                rt.room_img_url,
                -- Tính điểm trung bình, làm tròn 1 chữ số. Nếu chưa có ai đánh giá thì trả về 0
                COALESCE(ROUND(AVG(rtr.rating), 1), 0) AS average_rating,
                -- Đếm tổng số lượt đánh giá
                COUNT(rtr.id) AS total_reviews
            FROM room_types rt
            LEFT JOIN room_type_ratings rtr ON rt.id = rtr.room_type_id
            GROUP BY rt.id
            ORDER BY rt.name ASC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy danh sách các phòng chi tiết thuộc một loại phòng
     */
    async getRoomsByType(roomTypeId) {
        const query = `
            SELECT 
                id,
                room_type_id,
                room_number,
                status
            FROM room_details
            WHERE room_type_id = $1
            ORDER BY room_number ASC;
        `;
        const result = await pool.query(query, [roomTypeId]);
        return result.rows;
    }

    /**
     * Thêm hoặc Cập nhật đánh giá sao
     */
    async rateRoomType(roomTypeId, customerId, rating) {
        // Dùng ON CONFLICT để xử lý: Nếu (room_type_id, customer_id) đã tồn tại thì UPDATE rating
        const query = `
            INSERT INTO room_type_ratings (room_type_id, customer_id, rating)
            VALUES ($1, $2, $3)
            ON CONFLICT (room_type_id, customer_id) 
            DO UPDATE SET 
                rating = EXCLUDED.rating,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await pool.query(query, [roomTypeId, customerId, rating]);
        return result.rows[0];
    }

    /**
     * Lưu phòng (Nếu đã lưu rồi thì báo đã tồn tại)
     */
    async saveRoom(customerId, roomTypeId) {
        const checkQuery = `SELECT id FROM customer_saved_rooms WHERE customer_id = $1 AND room_type_id = $2`;
        const checkResult = await pool.query(checkQuery, [customerId, roomTypeId]);
        
        if (checkResult.rows.length > 0) {
            // Đã lưu
            return { is_saved: true, already_exists: true };
        } else {
            // Chưa lưu -> Thêm mới
            await pool.query(
                `INSERT INTO customer_saved_rooms (customer_id, room_type_id) VALUES ($1, $2)`, 
                [customerId, roomTypeId]
            );
            return { is_saved: true, already_exists: false };
        }
    }

    /**
     * Xóa phòng đã lưu
     */
    async removeSavedRoom(customerId, roomTypeId) {
        const query = `DELETE FROM customer_saved_rooms WHERE customer_id = $1 AND room_type_id = $2`;
        const result = await pool.query(query, [customerId, roomTypeId]);
        return result.rowCount > 0; // Trả về true nếu xóa thành công
    }

    /**
     * Lấy danh sách phòng đã lưu của khách hàng
     */
    async fetchSavedRooms(customerId) {
        const query = `
            SELECT 
                rt.id,
                rt.name,
                rt.hourly_price,
                rt.daily_price,
                rt.floor,
                rt.capacity,
                rt.bed_type,
                rt.room_size,
                rt.view_type,
                rt.amenities,
                rt.room_img_url,
                COALESCE(ROUND(AVG(rtr.rating), 1), 0) AS average_rating,
                COUNT(rtr.id) AS total_reviews
            FROM customer_saved_rooms csr
            INNER JOIN room_types rt ON csr.room_type_id = rt.id
            LEFT JOIN room_type_ratings rtr ON rt.id = rtr.room_type_id
            WHERE csr.customer_id = $1
            GROUP BY rt.id, csr.created_at
            ORDER BY csr.created_at DESC;
        `;
        const result = await pool.query(query, [customerId]);
        return result.rows;
    }
}

export default new CustomerRoomModel();

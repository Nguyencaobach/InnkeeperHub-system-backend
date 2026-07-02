import pool from '../../../../shared/database/db.js';

class CustomerRoomTypeModel {
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
}

export default new CustomerRoomTypeModel();

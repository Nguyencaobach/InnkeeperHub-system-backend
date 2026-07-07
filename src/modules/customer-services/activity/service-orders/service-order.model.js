import pool from '../../../../shared/database/db.js';

class ServiceOrderModel {
    /**
     * Tạo đơn đặt dịch vụ mới (PENDING)
     */
    async createOrder(bookingId, customerId, items) {
        const query = `
            INSERT INTO customer_service_orders (booking_id, customer_id, items, status)
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING *;
        `;
        const result = await pool.query(query, [bookingId, customerId, JSON.stringify(items)]);
        return result.rows[0];
    }

    /**
     * Lấy đơn của khách hàng theo booking_id (cho App)
     */
    async getOrdersByBookingAndCustomer(bookingId, customerId) {
        const query = `
            SELECT * FROM customer_service_orders
            WHERE booking_id = $1 AND customer_id = $2
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query, [bookingId, customerId]);
        return result.rows;
    }

    /**
     * Lấy tất cả đơn PENDING (cho Website admin)
     * JOIN bookings + customers + room_types + room_details để lấy thông tin hiển thị
     */
    async getAllPendingOrders() {
        const query = `
            SELECT 
                cso.id,
                cso.booking_id,
                cso.customer_id,
                cso.items,
                cso.status,
                TO_CHAR(cso.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
                b.booking_code,
                b.guest_name,
                b.guest_phone,
                rt.name AS room_type_name,
                rd.room_number
            FROM customer_service_orders cso
            INNER JOIN bookings b ON cso.booking_id = b.booking_id
            INNER JOIN room_types rt ON b.room_type_id = rt.id
            INNER JOIN room_details rd ON b.room_detail_id = rd.id
            WHERE cso.status = 'PENDING'
            ORDER BY cso.created_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy chi tiết 1 đơn theo ID
     */
    async getOrderById(orderId) {
        const query = `
            SELECT 
                cso.*,
                b.booking_code,
                b.guest_name,
                b.guest_phone,
                rt.name AS room_type_name,
                rd.room_number
            FROM customer_service_orders cso
            INNER JOIN bookings b ON cso.booking_id = b.booking_id
            INNER JOIN room_types rt ON b.room_type_id = rt.id
            INNER JOIN room_details rd ON b.room_detail_id = rd.id
            WHERE cso.id = $1;
        `;
        const result = await pool.query(query, [orderId]);
        return result.rows[0] || null;
    }

    /**
     * Xác nhận đơn → cập nhật status = 'CONFIRMED'
     */
    async confirmOrder(orderId) {
        const query = `
            UPDATE customer_service_orders
            SET status = 'CONFIRMED'
            WHERE id = $1 AND status = 'PENDING'
            RETURNING *;
        `;
        const result = await pool.query(query, [orderId]);
        return result.rows[0] || null;
    }

    /**
     * Hủy (xóa) đơn
     */
    async deleteOrder(orderId) {
        const query = `DELETE FROM customer_service_orders WHERE id = $1 RETURNING *;`;
        const result = await pool.query(query, [orderId]);
        return result.rows[0] || null;
    }
}

export default new ServiceOrderModel();

import db from '../../../shared/database/db.js';

// 1. Kiểm tra trùng lặp dữ liệu (Email, SĐT, CCCD, Username)
export const checkDuplicate = async (field, value, excludeId = null) => {
    if (!value) return false;
    let query = `SELECT customer_id FROM customers WHERE ${field} = $1`;
    let params = [value];
    if (excludeId) {
        query += ` AND customer_id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 2. Lấy danh sách khách hàng
export const fetchAllCustomers = async () => {
    const query = `
        SELECT customer_id, username, full_name, date_of_birth, address, 
               phone_number, email, avatar_url, cccd_number, cccd_issue_date, 
               cccd_issue_place, is_active, created_at
        FROM customers
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

// 3. Lấy chi tiết 1 khách hàng
export const fetchCustomerById = async (id) => {
    const query = `SELECT * FROM customers WHERE customer_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 4. Thêm mới khách hàng
export const insertCustomer = async (data) => {
    const query = `
        INSERT INTO customers 
        (username, password, full_name, date_of_birth, address, phone_number, email, avatar_url, cccd_number, cccd_issue_date, cccd_issue_place)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `;
    const values = [
        data.username, data.password, data.full_name, data.date_of_birth, data.address,
        data.phone_number, data.email, data.avatar_url, data.cccd_number, 
        data.cccd_issue_date, data.cccd_issue_place
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 5. Cập nhật thông tin khách hàng
export const updateCustomerById = async (id, data) => {
    let query = `
        UPDATE customers 
        SET full_name = $1, email = $2, date_of_birth = $3, address = $4, 
            phone_number = $5, avatar_url = $6, cccd_number = $7, 
            cccd_issue_date = $8, cccd_issue_place = $9, is_active = $10, 
            updated_at = CURRENT_TIMESTAMP
    `;
    let values = [
        data.full_name, data.email, data.date_of_birth, data.address,
        data.phone_number, data.avatar_url, data.cccd_number, 
        data.cccd_issue_date, data.cccd_issue_place, data.is_active
    ];
    
    // Nếu có đổi mật khẩu thì thêm vào câu lệnh update
    if (data.password) {
        query += `, password = $11 WHERE customer_id = $12 RETURNING *;`;
        values.push(data.password, id);
    } else {
        query += ` WHERE customer_id = $11 RETURNING *;`;
        values.push(id);
    }
    
    const result = await db.query(query, values);
    return result.rows[0];
};

// 6. Xóa mềm (Khóa tài khoản khách hàng)
export const softDeleteCustomerById = async (id) => {
    const query = `UPDATE customers SET is_active = FALSE WHERE customer_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

// 7. Xóa cứng (Xóa vĩnh viễn)
export const hardDeleteCustomerById = async (id) => {
    const query = `DELETE FROM customers WHERE customer_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};
import db from '../../../shared/database/db.js';

// 1. Thêm mới một dòng Nhật ký
export const insertLog = async (data) => {
    const query = `
        INSERT INTO activity_logs 
        (user_id, username, action, entity_type, entity_name, details) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *;
    `;
    const values = [
        data.user_id || null, 
        data.username || null, 
        data.action, 
        data.entity_type || null, 
        data.entity_name || null, 
        data.details ? JSON.stringify(data.details) : null // Ép kiểu Object thành chuỗi JSON để lưu vào DB
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 2. Lấy danh sách Nhật ký (Mặc định lấy 100 dòng mới nhất để chống lag)
// Có thể mở rộng thêm tính năng lọc theo username hoặc entity_type sau này
export const fetchAllLogs = async (limit = 100, offset = 0) => {
    const query = `
        SELECT * FROM activity_logs 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2;
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
};

// 3. Xóa log theo ngày (chỉ ADMIN) — xóa toàn bộ log từ ngày chỉ định trở về trước (bao gồm cả ngày đó)
// VD: chọn 08/06 → xóa toàn bộ log có created_at trong ngày 08/06 và cũ hơn
export const deleteLogsBefore = async (beforeDate) => {
    const query = `
        DELETE FROM activity_logs
        WHERE created_at < ($1::date + INTERVAL '1 day')
        RETURNING log_id;
    `;
    const result = await db.query(query, [beforeDate]);
    return result.rowCount; // Trả về số dòng đã bị xóa
};
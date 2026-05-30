import db from '../../../shared/database/db.js';

export const findUserByUsername = async (username) => {
    // Chỉ lấy các trường cần thiết, tránh SELECT * gây nặng hệ thống
    // Bắt buộc kiểm tra is_active = TRUE ngay từ vòng gửi xe của DB
    const query = `
        SELECT user_id, username, password, role, full_name, is_active 
        FROM business_users 
        WHERE username = $1 AND is_active = TRUE 
        LIMIT 1
    `;

    const result = await db.query(query, [username]);
    
    // Trả về dòng dữ liệu đầu tiên, nếu không có thì trả về null
    return result.rows[0] || null;
};
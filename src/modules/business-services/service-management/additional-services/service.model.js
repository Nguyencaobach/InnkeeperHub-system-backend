import db from '../../../../shared/database/db.js';

// 1. Kiểm tra trùng tên dịch vụ trong CÙNG MỘT danh mục
export const checkServiceNameExists = async (name, category, excludeId = null) => {
    let query = `SELECT service_id FROM services WHERE name = $1 AND category = $2`;
    let params = [name, category];
    
    // Nếu đang chỉnh sửa thì loại trừ chính nó ra
    if (excludeId) {
        query += ` AND service_id != $3`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 2. Thêm mới dịch vụ
export const insertService = async (data) => {
    const query = `
        INSERT INTO services 
        (category, name, unit, price, image_url, description, is_active) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *;
    `;
    const values = [
        data.category, data.name, data.unit, 
        data.price, data.image_url, data.description, data.is_active
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 3. Lấy danh sách dịch vụ (Hỗ trợ lọc theo category)
export const fetchAllServices = async (category = null) => {
    let query = `SELECT * FROM services`;
    let params = [];

    // Nếu Frontend truyền category lên thì lọc, không thì lấy tất cả
    if (category) {
        query += ` WHERE category = $1`;
        params.push(category);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
};

// 4. Lấy chi tiết 1 dịch vụ
export const fetchServiceById = async (id) => {
    const query = `SELECT * FROM services WHERE service_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 5. Cập nhật dịch vụ
export const updateServiceById = async (id, data) => {
    const query = `
        UPDATE services 
        SET category = $1, name = $2, unit = $3, 
            price = $4, image_url = $5, description = $6, is_active = $7, 
            updated_at = CURRENT_TIMESTAMP
        WHERE service_id = $8 
        RETURNING *;
    `;
    const values = [
        data.category, data.name, data.unit, 
        data.price, data.image_url, data.description, data.is_active, id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 6. Xóa dịch vụ
export const deleteServiceById = async (id) => {
    const query = `DELETE FROM services WHERE service_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};
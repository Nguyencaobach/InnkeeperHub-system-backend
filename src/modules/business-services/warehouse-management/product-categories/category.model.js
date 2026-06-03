import db from '../../../../shared/database/db.js';

// 1. Kiểm tra tên danh mục có bị trùng không
export const checkNameExists = async (name, excludeId = null) => {
    let query = `SELECT category_id FROM product_categories WHERE name = $1`;
    let params = [name];
    
    // Nếu là đang Cập nhật thì phải loại trừ chính ID của nó ra
    if (excludeId) {
        query += ` AND category_id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 2. Lấy danh sách toàn bộ danh mục (Sắp xếp theo thời gian tạo)
export const fetchAllCategories = async () => {
    const query = `SELECT * FROM product_categories ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
};

// 3. Lấy chi tiết 1 danh mục theo ID
export const fetchCategoryById = async (id) => {
    const query = `SELECT * FROM product_categories WHERE category_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 4. Thêm mới danh mục
export const insertCategory = async (data) => {
    const query = `
        INSERT INTO product_categories (name, description) 
        VALUES ($1, $2) 
        RETURNING *;
    `;
    const values = [data.name, data.description];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 5. Cập nhật danh mục
export const updateCategoryById = async (id, data) => {
    const query = `
        UPDATE product_categories 
        SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE category_id = $3 
        RETURNING *;
    `;
    const values = [data.name, data.description, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 6. Xóa cứng danh mục (Chỉ xóa được nếu chưa có sản phẩm nào thuộc danh mục này)
export const deleteCategoryById = async (id) => {
    const query = `DELETE FROM product_categories WHERE category_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};
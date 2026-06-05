import db from '../../../../shared/database/db.js';

// 1. Kiểm tra xem Category (Danh mục) có tồn tại thật không
export const checkCategoryExists = async (categoryId) => {
    const query = `SELECT category_id FROM product_categories WHERE category_id = $1`;
    const result = await db.query(query, [categoryId]);
    return result.rows.length > 0;
};

// 2. Kiểm tra xem Mã SKU đã có ai dùng chưa (chống trùng lặp)
export const checkSkuExists = async (sku, excludeId = null) => {
    let query = `SELECT product_id FROM products WHERE sku = $1`;
    let params = [sku];
    
    // Nếu đang chỉnh sửa thì loại trừ chính bản thân nó ra
    if (excludeId) {
        query += ` AND product_id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 3. Thêm mới sản phẩm
export const insertProduct = async (data) => {
    const query = `
        INSERT INTO products 
        (category_id, sku, name, unit, retail_price, image_url, is_active) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *;
    `;
    const values = [
        data.category_id, data.sku, data.name, data.unit, 
        data.retail_price, data.image_url, data.is_active
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 4. Lấy danh sách sản phẩm (Kèm theo tên danh mục)
export const fetchAllProducts = async () => {
    const query = `
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.category_id
        ORDER BY p.created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
};

// 5. Lấy 1 sản phẩm cụ thể
export const fetchProductById = async (id) => {
    const query = `SELECT * FROM products WHERE product_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 6. Cập nhật sản phẩm
export const updateProductById = async (id, data) => {
    const query = `
        UPDATE products 
        SET category_id = $1, sku = $2, name = $3, unit = $4, 
            retail_price = $5, image_url = $6, is_active = $7, 
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $8 
        RETURNING *;
    `;
    const values = [
        data.category_id, data.sku, data.name, data.unit, 
        data.retail_price, data.image_url, data.is_active, id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 7. Xóa sản phẩm
export const deleteProductById = async (id) => {
    const query = `DELETE FROM products WHERE product_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};
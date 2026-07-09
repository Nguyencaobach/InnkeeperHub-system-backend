import db from '../../../../shared/database/db.js';

// 1. Kiểm tra trùng mã code (Dùng lúc tạo mới hoặc cập nhật)
export const checkCodeExists = async (code, excludeId = null) => {
    let query = `SELECT discount_id FROM discount_codes WHERE code = $1`;
    let params = [code];
    
    // Nếu đang cập nhật thì loại trừ chính bản thân nó ra
    if (excludeId) {
        query += ` AND discount_id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 2. Thêm mới mã giảm giá
export const insertDiscount = async (data) => {
    const query = `
        INSERT INTO discount_codes 
        (code, description, discount_amount, min_order_value, usage_limit, start_date, end_date, is_active, points_required) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
    `;
    const values = [
        data.code, data.description, data.discount_amount, data.min_order_value, 
        data.usage_limit, data.start_date, data.end_date, data.is_active,
        data.points_required || 0
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 3. Lấy danh sách tất cả mã giảm giá
export const fetchAllDiscounts = async () => {
    // Sắp xếp ưu tiên ngày kết thúc xa nhất hoặc mới tạo lên đầu
    const query = `SELECT * FROM discount_codes ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
};

// 4. Lấy chi tiết 1 mã giảm giá
export const fetchDiscountById = async (id) => {
    const query = `SELECT * FROM discount_codes WHERE discount_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 5. Cập nhật mã giảm giá
export const updateDiscountById = async (id, data) => {
    const query = `
        UPDATE discount_codes 
        SET code = $1, description = $2, discount_amount = $3, min_order_value = $4, 
            usage_limit = $5, start_date = $6, end_date = $7, is_active = $8, 
            points_required = $9, updated_at = CURRENT_TIMESTAMP
        WHERE discount_id = $10 
        RETURNING *;
    `;
    const values = [
        data.code, data.description, data.discount_amount, data.min_order_value, 
        data.usage_limit, data.start_date, data.end_date, data.is_active,
        data.points_required || 0, id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 6. Xóa mã giảm giá
export const deleteDiscountById = async (id) => {
    const query = `DELETE FROM discount_codes WHERE discount_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};

// =========================================================
// HÀM CRON JOB: TỰ ĐỘNG KHÓA MÃ GIẢM GIÁ HẾT HẠN
// =========================================================
export const autoLockExpiredDiscounts = async () => {
    // So sánh theo ngày (giống lô hàng): khóa khi ngày VN hiện tại > end_date
    // Mã giảm giá vẫn hoạt động xuyên suốt ngày end_date, bị khóa vào 00:00 ngày hôm sau
    const query = `
        UPDATE discount_codes 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE end_date::DATE < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE AND is_active = true
        RETURNING discount_id;
    `;
    const result = await db.query(query);
    
    // Trả về số lượng mã vừa bị khóa để in ra log
    return result.rowCount; 
};
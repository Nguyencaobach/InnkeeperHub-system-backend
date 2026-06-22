import db from '../../../shared/database/db.js';

// ============================================================
// FIND — Tìm customer theo username (dùng cho login)
// ============================================================
export const findCustomerByUsername = async (username) => {
    // Chỉ lấy các trường cần thiết, bắt buộc kiểm tra is_active = TRUE
    const query = `
        SELECT customer_id, username, password, full_name, email, phone_number,
               avatar_url, is_active
        FROM customers
        WHERE username = $1 AND is_active = TRUE
        LIMIT 1
    `;
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
};

// ============================================================
// CHECK — Kiểm tra username/email/phone đã tồn tại chưa (dùng cho register)
// ============================================================
export const checkCustomerExists = async (username, email, phone_number) => {
    const query = `
        SELECT
            EXISTS(SELECT 1 FROM customers WHERE username = $1)      AS username_taken,
            EXISTS(SELECT 1 FROM customers WHERE email = $2)         AS email_taken,
            EXISTS(SELECT 1 FROM customers WHERE phone_number = $3)  AS phone_taken
    `;
    const result = await db.query(query, [username, email, phone_number]);
    return result.rows[0];
};

// ============================================================
// CREATE — Tạo tài khoản customer mới
// ============================================================
export const createCustomer = async ({ username, password, full_name, email, phone_number }) => {
    const query = `
        INSERT INTO customers (username, password, full_name, email, phone_number)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING customer_id, username, full_name, email, phone_number, avatar_url, created_at
    `;
    const result = await db.query(query, [username, password, full_name, email, phone_number]);
    return result.rows[0];
};

// ============================================================
// FIND — Tìm customer theo email (dùng cho forgot password)
// ============================================================
export const findCustomerByEmail = async (email) => {
    const query = `
        SELECT customer_id, username, full_name, email, is_active
        FROM customers
        WHERE email = $1 AND is_active = TRUE
        LIMIT 1
    `;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
};

// ============================================================
// UPDATE — Đổi mật khẩu customer (dùng cho reset password)
// ============================================================
export const updateCustomerPassword = async (customer_id, hashedPassword) => {
    const query = `
        UPDATE customers
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $2
        RETURNING customer_id, username
    `;
    const result = await db.query(query, [hashedPassword, customer_id]);
    return result.rows[0] || null;
};

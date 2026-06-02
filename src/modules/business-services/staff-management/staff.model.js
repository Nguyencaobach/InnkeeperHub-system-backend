import db from '../../../shared/database/db.js';

// 1. Hàm dùng chung để kiểm tra trùng lặp (Kiểm tra được cả email, cccd, sđt, username)
export const checkDuplicate = async (field, value, excludeId = null) => {
    if (!value) return false;
    let query = `SELECT user_id FROM business_users WHERE ${field} = $1`;
    let params = [value];
    if (excludeId) {
        query += ` AND user_id != $2`;
        params.push(excludeId);
    }
    const result = await db.query(query, params);
    return result.rows.length > 0;
};

// 2. Lấy danh sách nhân viên + Thông tin ngân hàng (Dùng LEFT JOIN)
export const fetchAllStaff = async () => {
    const query = `
        SELECT 
            u.user_id, u.username, u.role, u.is_active, u.full_name, 
            u.gender, u.date_of_birth, u.email, u.phone_number, 
            u.permanent_address, u.cccd_number, u.cccd_issue_date, u.cccd_issue_place,
            b.bank_name, b.bank_account_number, b.bank_account_name
        FROM business_users u
        LEFT JOIN user_bank_details b ON u.user_id = b.user_id
        ORDER BY u.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};

// 3. Lấy chi tiết 1 nhân viên
export const fetchStaffById = async (id) => {
    const query = `
        SELECT u.*, b.bank_name, b.bank_account_number, b.bank_account_name
        FROM business_users u
        LEFT JOIN user_bank_details b ON u.user_id = b.user_id
        WHERE u.user_id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
};

// 4. Thêm mới nhân viên (Dùng Transaction để đảm bảo an toàn 100%)
export const insertStaff = async (userData, bankData) => {
    const client = await db.connect(); // Mở luồng giao dịch riêng
    try {
        await client.query('BEGIN');
        
        // 4.1 Thêm vào bảng business_users
        const userQuery = `
            INSERT INTO business_users 
            (username, password, role, full_name, email, gender, date_of_birth, phone_number, permanent_address, cccd_number, cccd_issue_date, cccd_issue_place)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const userValues = [
            userData.username, userData.password, userData.role, userData.full_name, userData.email,
            userData.gender, userData.date_of_birth, userData.phone_number, userData.permanent_address,
            userData.cccd_number, userData.cccd_issue_date, userData.cccd_issue_place
        ];
        const userResult = await client.query(userQuery, userValues);
        const newUser = userResult.rows[0];

        // 4.2 Thêm vào bảng user_bank_details (Nếu người dùng có nhập thông tin ngân hàng)
        if (bankData.bank_account_number) {
            const bankQuery = `
                INSERT INTO user_bank_details (user_id, bank_name, bank_account_number, bank_account_name)
                VALUES ($1, $2, $3, $4)
            `;
            const bankValues = [newUser.user_id, bankData.bank_name, bankData.bank_account_number, bankData.bank_account_name];
            await client.query(bankQuery, bankValues);
        }

        await client.query('COMMIT'); // Lưu chính thức vào DB
        return newUser;
    } catch (error) {
        await client.query('ROLLBACK'); // Có lỗi -> Hủy toàn bộ thao tác
        throw error;
    } finally {
        client.release(); // Trả kết nối lại cho hệ thống
    }
};

// 5. Cập nhật thông tin nhân viên
export const updateStaffById = async (id, userData, bankData) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 5.1 Cập nhật bảng business_users (Nếu có đổi mật khẩu thì nối thêm vào chuỗi query)
        let userQuery = `
            UPDATE business_users 
            SET role = $1, is_active = $2, full_name = $3, email = $4, 
                gender = $5, date_of_birth = $6, phone_number = $7, permanent_address = $8, 
                cccd_number = $9, cccd_issue_date = $10, cccd_issue_place = $11, updated_at = CURRENT_TIMESTAMP
        `;
        let userValues = [
            userData.role, userData.is_active, userData.full_name, userData.email,
            userData.gender, userData.date_of_birth, userData.phone_number, userData.permanent_address,
            userData.cccd_number, userData.cccd_issue_date, userData.cccd_issue_place
        ];
        
        if (userData.password) {
            userQuery += `, password = $12 WHERE user_id = $13 RETURNING *;`;
            userValues.push(userData.password, id);
        } else {
            userQuery += ` WHERE user_id = $12 RETURNING *;`;
            userValues.push(id);
        }
        
        const userResult = await client.query(userQuery, userValues);

        // 5.2 Cập nhật bảng user_bank_details (Dùng lệnh UPSERT thông minh của PostgreSQL)
        if (bankData.bank_account_number) {
            const bankQuery = `
                INSERT INTO user_bank_details (user_id, bank_name, bank_account_number, bank_account_name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    bank_name = EXCLUDED.bank_name,
                    bank_account_number = EXCLUDED.bank_account_number,
                    bank_account_name = EXCLUDED.bank_account_name,
                    updated_at = CURRENT_TIMESTAMP;
            `;
            const bankValues = [id, bankData.bank_name, bankData.bank_account_number, bankData.bank_account_name];
            await client.query(bankQuery, bankValues);
        }

        await client.query('COMMIT');
        return userResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// 6. Xóa mềm (Soft Delete) - Khóa tài khoản
export const softDeleteStaffById = async (id) => {
    const query = `UPDATE business_users SET is_active = FALSE WHERE user_id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0];
};
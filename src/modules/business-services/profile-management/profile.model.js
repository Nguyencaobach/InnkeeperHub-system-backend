import db from '../../../shared/database/db.js';

// =============================================
// HỒ SƠ CÁ NHÂN (business_users)
// =============================================

/**
 * Lấy thông tin hồ sơ của user đang đăng nhập (không trả về password)
 */
export const fetchProfileById = async (userId) => {
    const query = `
        SELECT 
            user_id, username, role, is_active,
            full_name, gender, date_of_birth, avatar_url,
            email, phone_number, permanent_address,
            cccd_number, cccd_issue_date, cccd_issue_place,
            created_at, updated_at
        FROM business_users
        WHERE user_id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
};

/**
 * Kiểm tra trùng lặp email / phone_number khi cập nhật (loại trừ chính user đó)
 */
export const checkProfileDuplicate = async (field, value, excludeId) => {
    if (!value) return false;
    const query = `SELECT user_id FROM business_users WHERE ${field} = $1 AND user_id != $2`;
    const result = await db.query(query, [value, excludeId]);
    return result.rows.length > 0;
};

/**
 * Cập nhật thông tin hồ sơ cá nhân
 * Chỉ update các trường user được phép tự sửa: không đụng role, is_active, username
 */
export const updateProfileById = async (userId, data) => {
    let setClauses = [
        'full_name = $1',
        'email = $2',
        'phone_number = $3',
        'gender = $4',
        'permanent_address = $5',
        'updated_at = CURRENT_TIMESTAMP'
    ];
    let values = [
        data.full_name,
        data.email     || null,
        data.phone_number || null,
        data.gender    || null,
        data.permanent_address || null,
    ];

    // Nếu có đổi mật khẩu thì thêm vào
    if (data.password) {
        setClauses.push(`password = $${values.length + 1}`);
        values.push(data.password);
    }

    values.push(userId); // tham số cuối cho WHERE

    const query = `
        UPDATE business_users
        SET ${setClauses.join(', ')}
        WHERE user_id = $${values.length}
        RETURNING user_id, username, role, is_active,
                  full_name, gender, email, phone_number,
                  permanent_address, avatar_url, updated_at
    `;
    const result = await db.query(query, values);
    return result.rows[0];
};

/**
 * Cập nhật chỉ avatar_url của user
 */
export const updateAvatarById = async (userId, avatarUrl) => {
    const query = `
        UPDATE business_users
        SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING user_id, username, role, full_name, avatar_url, updated_at
    `;
    const result = await db.query(query, [avatarUrl, userId]);
    return result.rows[0];
};

// =============================================
// THÔNG TIN DOANH NGHIỆP (business_settings) — Chỉ ADMIN
// =============================================

/**
 * Lấy thông tin doanh nghiệp (chỉ có 1 bản ghi duy nhất trong bảng)
 */
export const fetchBusinessSettings = async () => {
    const query = `SELECT * FROM business_settings ORDER BY id ASC LIMIT 1`;
    const result = await db.query(query);
    return result.rows[0] || null;
};

/**
 * Tạo mới hoặc cập nhật thông tin doanh nghiệp (UPSERT)
 * Vì bảng chỉ có 1 bản ghi: nếu chưa có thì INSERT, đã có thì UPDATE
 */
export const upsertBusinessSettings = async (data) => {
    // Kiểm tra xem đã có bản ghi nào chưa
    const existing = await fetchBusinessSettings();

    if (!existing) {
        // Chưa có → INSERT
        const query = `
            INSERT INTO business_settings (
                business_type, business_name, tax_code, legal_representative,
                business_address, logo_url,
                bank_account_number, bank_name, bank_account_name,
                hotline, email_contact, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [
            data.business_type    || null,
            data.business_name,
            data.tax_code         || null,
            data.legal_representative || null,
            data.business_address || null,
            data.logo_url         || null,
            data.bank_account_number || null,
            data.bank_name        || null,
            data.bank_account_name   || null,
            data.hotline          || null,
            data.email_contact    || null,
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    } else {
        // Đã có → UPDATE
        const query = `
            UPDATE business_settings SET
                business_type        = $1,
                business_name        = $2,
                tax_code             = $3,
                legal_representative = $4,
                business_address     = $5,
                logo_url             = $6,
                bank_account_number  = $7,
                bank_name            = $8,
                bank_account_name    = $9,
                hotline              = $10,
                email_contact        = $11,
                updated_at           = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *
        `;
        const values = [
            data.business_type    || null,
            data.business_name,
            data.tax_code         || null,
            data.legal_representative || null,
            data.business_address || null,
            data.logo_url         || null,
            data.bank_account_number || null,
            data.bank_name        || null,
            data.bank_account_name   || null,
            data.hotline          || null,
            data.email_contact    || null,
            existing.id,
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }
};

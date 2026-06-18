import fs from 'fs';
import path from 'path';
import {
    fetchProfileById,
    checkProfileDuplicate,
    updateProfileById,
    updateAvatarById,
    fetchBusinessSettings,
    upsertBusinessSettings,
} from './profile.model.js';
import { hashPassword } from '../../../shared/utils/hash.util.js';

// =============================================
// HỒ SƠ CÁ NHÂN
// =============================================

/**
 * Lấy hồ sơ cá nhân của user đang đăng nhập
 */
export const getProfileLogic = async (userId) => {
    const profile = await fetchProfileById(userId);
    if (!profile) throw new Error('Không tìm thấy thông tin người dùng.');
    return profile;
};

/**
 * Cập nhật hồ sơ cá nhân
 * - Chỉ user đang đăng nhập mới được cập nhật hồ sơ của chính họ
 * - Kiểm tra trùng email / phone_number
 * - Hash mật khẩu nếu có đổi
 */
export const updateProfileLogic = async (userId, data) => {
    const currentUser = await fetchProfileById(userId);
    if (!currentUser) throw new Error('Không tìm thấy thông tin người dùng.');

    // Kiểm tra trùng email (loại trừ chính user đó)
    if (data.email && await checkProfileDuplicate('email', data.email, userId)) {
        throw new Error('Email này đã được sử dụng bởi tài khoản khác.');
    }

    // Kiểm tra trùng số điện thoại
    if (data.phone_number && await checkProfileDuplicate('phone_number', data.phone_number, userId)) {
        throw new Error('Số điện thoại này đã được sử dụng bởi tài khoản khác.');
    }

    // Hash mật khẩu nếu user muốn đổi
    if (data.password && data.password.trim() !== '') {
        data.password = await hashPassword(data.password);
    } else {
        delete data.password;
    }

    return await updateProfileById(userId, data);
};

// =============================================
// UPLOAD AVATAR
// =============================================

/**
 * Xóa ảnh avatar cũ trên ổ cứng (nếu đị chỉ là local)
 */
const deleteOldAvatar = (avatarUrl) => {
    if (!avatarUrl) return;
    // Chỉ xóa file local — nhận dạng bằng path tương đối /uploads/
    if (avatarUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', avatarUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

/**
 * Upload avatar mới, xóa avatar cũ, cập nhật DB
 */
export const uploadAvatarLogic = async (userId, file) => {
    const currentUser = await fetchProfileById(userId);
    if (!currentUser) throw new Error('Không tìm thấy người dùng.');

    // Xóa avatar cũ trên ổ cứng
    deleteOldAvatar(currentUser.avatar_url);

    // Lưu path tương đối vào DB — frontend tự ghép domain qua Vite proxy
    const avatarUrl = `/uploads/avatar/${file.filename}`;

    // Cập nhật vào DB
    return await updateAvatarById(userId, avatarUrl);
};

// =============================================
// THÔNG TIN DOANH NGHIỆP
// =============================================

/**
 * Lấy thông tin doanh nghiệp
 */
export const getBusinessSettingsLogic = async () => {
    const settings = await fetchBusinessSettings();
    // Trả về object rỗng nếu chưa thiết lập, không báo lỗi
    return settings || {};
};

/**
 * Tạo mới / Cập nhật thông tin doanh nghiệp (chỉ ADMIN)
 */
export const upsertBusinessSettingsLogic = async (data) => {
    if (!data.business_name || data.business_name.trim() === '') {
        throw new Error('Tên doanh nghiệp không được để trống.');
    }
    return await upsertBusinessSettings(data);
};

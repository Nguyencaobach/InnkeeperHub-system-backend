import fs from 'fs';
import path from 'path';
import {
    fetchCustomerProfileById,
    checkProfileDuplicate,
    updateCustomerProfileById,
    updateCustomerAvatarById,
    updateCustomerCCCDById
} from './profile.model.js';
import { hashPassword } from '../../../shared/utils/hash.util.js';

// Hàm phụ trợ: Xóa ảnh vật lý trên server
const deleteOldAvatar = (avatarUrl) => {
    if (!avatarUrl) return;
    if (avatarUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', avatarUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

export const getProfileLogic = async (customerId) => {
    const profile = await fetchCustomerProfileById(customerId);
    if (!profile) throw new Error('Không tìm thấy thông tin tài khoản.');
    return profile;
};

export const updateProfileLogic = async (customerId, data) => {
    const currentCustomer = await fetchCustomerProfileById(customerId);
    if (!currentCustomer) throw new Error('Không tìm thấy thông tin tài khoản.');

    if (data.email && await checkProfileDuplicate('email', data.email, customerId)) {
        throw new Error('Email này đã được đăng ký bởi tài khoản khác.');
    }

    if (data.phone_number && await checkProfileDuplicate('phone_number', data.phone_number, customerId)) {
        throw new Error('Số điện thoại này đã được sử dụng.');
    }

    if (data.password && data.password.trim() !== '') {
        data.password = await hashPassword(data.password);
    } else {
        delete data.password;
    }

    return await updateCustomerProfileById(customerId, data);
};

export const uploadAvatarLogic = async (customerId, file) => {
    const currentCustomer = await fetchCustomerProfileById(customerId);
    if (!currentCustomer) throw new Error('Không tìm thấy thông tin tài khoản.');

    deleteOldAvatar(currentCustomer.avatar_url);

    const avatarUrl = `/uploads/customer-avatar/${file.filename}`;
    return await updateCustomerAvatarById(customerId, avatarUrl);
};

export const updateCCCDLogic = async (customerId, frontUrl, backUrl) => {
    const currentCustomer = await fetchCustomerProfileById(customerId);
    if (!currentCustomer) throw new Error('Không tìm thấy thông tin tài khoản.');

    // Xóa file cũ nếu có
    if (frontUrl && currentCustomer.cccd_front_url) {
        deleteOldAvatar(currentCustomer.cccd_front_url);
    }
    if (backUrl && currentCustomer.cccd_back_url) {
        deleteOldAvatar(currentCustomer.cccd_back_url);
    }

    return await updateCustomerCCCDById(customerId, frontUrl, backUrl);
};

import { 
    checkDuplicate, fetchAllCustomers, fetchCustomerById, 
    insertCustomer, updateCustomerById, softDeleteCustomerById,
    hardDeleteCustomerById
} from './customer.model.js';
import { hashPassword } from '../../../shared/utils/hash.util.js';

export const createLogic = async (data) => {
    if (await checkDuplicate('email', data.email)) throw new Error("Email này đã được sử dụng.");
    if (await checkDuplicate('phone_number', data.phone_number)) throw new Error("Số điện thoại này đã được sử dụng.");
    if (await checkDuplicate('cccd_number', data.cccd_number)) throw new Error("Số CCCD này đã tồn tại trong hệ thống.");

    // Tự sinh username từ email nếu không nhập (VD: khachhang@gmail.com -> khachhang)
    if (!data.username || data.username.trim() === '') {
        data.username = data.email.split('@')[0];
    }
    // Thêm hậu tố ngẫu nhiên nếu username tự sinh bị trùng
    if (await checkDuplicate('username', data.username)) {
        data.username = `${data.username}${Math.floor(Math.random() * 1000)}`;
    }

    // Mã hóa mật khẩu
    data.password = await hashPassword(data.password);

    return await insertCustomer(data);
};

export const getListLogic = async () => {
    return await fetchAllCustomers();
};

export const updateLogic = async (id, data) => {
    const currentCustomer = await fetchCustomerById(id);
    if (!currentCustomer) throw new Error("Không tìm thấy thông tin khách hàng này.");

    if (data.is_active === undefined) data.is_active = currentCustomer.is_active;

    if (await checkDuplicate('email', data.email, id)) throw new Error("Email này đã được sử dụng bởi khách hàng khác.");
    if (await checkDuplicate('phone_number', data.phone_number, id)) throw new Error("Số điện thoại này đã được sử dụng.");
    if (await checkDuplicate('cccd_number', data.cccd_number, id)) throw new Error("Số CCCD này đã tồn tại.");

    if (data.password && data.password.trim() !== '') {
        data.password = await hashPassword(data.password);
    } else {
        delete data.password; 
    }

    return await updateCustomerById(id, data);
};

export const deleteLogic = async (id) => {
    const currentCustomer = await fetchCustomerById(id);
    if (!currentCustomer) throw new Error("Không tìm thấy thông tin khách hàng này.");

    return await softDeleteCustomerById(id);
};

export const hardDeleteLogic = async (id) => {
    const currentCustomer = await fetchCustomerById(id);
    if (!currentCustomer) throw new Error("Không tìm thấy thông tin khách hàng này.");

    return await hardDeleteCustomerById(id);
};
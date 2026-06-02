import { 
    checkDuplicate, fetchAllStaff, fetchStaffById, 
    insertStaff, updateStaffById, softDeleteStaffById 
} from './staff.model.js';
import { hashPassword } from '../../../shared/utils/hash.util.js';

export const createLogic = async (data) => {
    // 1. Kiểm tra trùng lặp các thông tin độc quyền
    if (await checkDuplicate('email', data.email)) throw new Error("Email này đã được sử dụng.");
    if (await checkDuplicate('phone_number', data.phone_number)) throw new Error("Số điện thoại này đã được sử dụng.");
    if (await checkDuplicate('cccd_number', data.cccd_number)) throw new Error("Số CCCD này đã tồn tại trong hệ thống.");

    // 2. Tự sinh username từ email nếu không nhập (VD: a@gmail.com -> a)
    if (!data.username || data.username.trim() === '') {
        data.username = data.email.split('@')[0];
    }
    // Kiểm tra lại xem username tự sinh có bị trùng không
    if (await checkDuplicate('username', data.username)) {
        throw new Error("Username đã bị trùng. Vui lòng tự nhập một Username khác thay vì để trống.");
    }

    // 3. Bảo mật: Mã hóa mật khẩu trước khi đưa xuống DB
    data.password = await hashPassword(data.password);

    // 4. Gom nhóm thông tin ngân hàng để đẩy sang bảng user_bank_details
    const bankData = {
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
        bank_account_name: data.bank_account_name
    };

    // 5. Gọi hàm Model (đã có Transaction bảo vệ)
    return await insertStaff(data, bankData);
};

export const getListLogic = async () => {
    // Lấy danh sách (Đã được LEFT JOIN lấy sẵn thẻ ngân hàng bên Model)
    return await fetchAllStaff();
};

export const updateLogic = async (id, data, currentUserRole) => {
    // 1. Kiểm tra nhân viên có tồn tại không
    const currentStaff = await fetchStaffById(id);
    if (!currentStaff) throw new Error("Không tìm thấy thông tin nhân viên này.");

    // 2. CHỐT CHẶN BẢO MẬT: Kiểm tra quyền thay đổi Role
    if (data.role && data.role !== currentStaff.role) {
        // Nếu chức vụ bị thay đổi, bắt buộc người thực hiện phải là ADMIN
        if (currentUserRole !== 'ADMIN') {
            throw new Error("Từ chối truy cập: Chỉ ADMIN mới có quyền thay đổi chức vụ của nhân viên.");
        }
    } else {
        // Nếu không đổi, hoặc không truyền lên, giữ nguyên chức vụ cũ
        data.role = currentStaff.role;
    }

    // Giữ nguyên trạng thái (khóa/mở khóa) nếu không truyền lên
    if (data.is_active === undefined) data.is_active = currentStaff.is_active;

    // 3. Kiểm tra trùng lặp dữ liệu (Loại trừ chính nhân viên này ra)
    if (await checkDuplicate('email', data.email, id)) throw new Error("Email này đã được sử dụng bởi nhân viên khác.");
    if (await checkDuplicate('phone_number', data.phone_number, id)) throw new Error("Số điện thoại này đã được sử dụng.");
    if (await checkDuplicate('cccd_number', data.cccd_number, id)) throw new Error("Số CCCD này đã tồn tại.");

    // 4. Xử lý mật khẩu (Chỉ mã hóa và đổi nếu người dùng có nhập mật khẩu mới)
    if (data.password && data.password.trim() !== '') {
        data.password = await hashPassword(data.password);
    } else {
        delete data.password; // Xóa trường này đi để Model biết là không cần update pass
    }

    // 5. Gom nhóm thông tin ngân hàng
    const bankData = {
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
        bank_account_name: data.bank_account_name
    };

    return await updateStaffById(id, data, bankData);
};

export const deleteLogic = async (id) => {
    const currentStaff = await fetchStaffById(id);
    if (!currentStaff) throw new Error("Không tìm thấy thông tin nhân viên này.");

    // Thực hiện "Xóa mềm" (Chỉ khóa tài khoản, không xóa mất dữ liệu)
    return await softDeleteStaffById(id);
};
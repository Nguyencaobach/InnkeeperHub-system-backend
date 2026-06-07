import { 
    checkCodeExists, insertDiscount, fetchAllDiscounts, 
    fetchDiscountById, updateDiscountById, deleteDiscountById 
} from './discount.model.js';

export const createLogic = async (data) => {
    // 1. Kiểm tra mã giảm giá đã tồn tại chưa
    const isCodeExist = await checkCodeExists(data.code);
    if (isCodeExist) {
        throw new Error(`Mã giảm giá '${data.code}' đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.`);
    }

    // 2. Ép kiểu an toàn (đã được Joi xử lý một phần, ta đảm bảo lại)
    data.code = data.code.toUpperCase();

    // 3. Tiến hành lưu vào database
    return await insertDiscount(data);
};

export const getListLogic = async () => {
    return await fetchAllDiscounts();
};

export const updateLogic = async (id, data) => {
    // 1. Kiểm tra xem mã giảm giá này có tồn tại không
    const currentDiscount = await fetchDiscountById(id);
    if (!currentDiscount) {
        throw new Error("Không tìm thấy mã giảm giá này.");
    }

    // 2. Kiểm tra xem nếu đổi tên code thì có bị trùng với code của ID khác không
    data.code = data.code.toUpperCase();
    const isCodeExist = await checkCodeExists(data.code, id);
    if (isCodeExist) {
        throw new Error(`Mã giảm giá '${data.code}' đã bị trùng với một mã khác trong hệ thống.`);
    }

    // 3. Tiến hành cập nhật
    return await updateDiscountById(id, data);
};

export const deleteLogic = async (id) => {
    // 1. Kiểm tra tồn tại
    const currentDiscount = await fetchDiscountById(id);
    if (!currentDiscount) {
        throw new Error("Không tìm thấy mã giảm giá này.");
    }

    // 2. Xóa
    return await deleteDiscountById(id);
};
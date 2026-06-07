import { 
    checkCodeExists, insertDiscount, fetchAllDiscounts, 
    fetchDiscountById, updateDiscountById, deleteDiscountById 
} from './discount.model.js';

// =========================================================
// HELPER: Tính trạng thái tự động dựa vào ngày (giờ VN)
// =========================================================
const computeAutoStatus = (start_date, end_date) => {
    // Lấy ngày hiện tại theo giờ Việt Nam (UTC+7), chuẩn hóa về midnight
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const today = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate());

    // Joi.date() đã convert "YYYY-MM-DD" thành Date Object (UTC midnight)
    // → Phải dùng getUTC* để lấy đúng ngày, không bị lệch múi giờ
    const parseDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) {
            return new Date(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate());
        }
        const [y, m, d] = String(val).substring(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const end = parseDate(end_date);

    // Đã hết hạn → khóa ngay, không cần chờ cron
    if (end && end < today) return false;

    // Đang trong khoảng hợp lệ (end >= hôm nay) → mở
    if (end && end >= today) return true;

    // Không có ngày kết thúc → không override
    return null;
};

// =========================================================

export const createLogic = async (data) => {
    // 1. Kiểm tra mã giảm giá đã tồn tại chưa
    const isCodeExist = await checkCodeExists(data.code);
    if (isCodeExist) {
        throw new Error(`Mã giảm giá '${data.code}' đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.`);
    }

    // 2. Ép kiểu an toàn
    data.code = data.code.toUpperCase();

    // 3. TỰ ĐỘNG tính trạng thái theo ngày — không cần chờ cron
    const autoStatus = computeAutoStatus(data.start_date, data.end_date);
    if (autoStatus !== null) {
        data.is_active = autoStatus;
    }

    // 4. Tiến hành lưu vào database
    return await insertDiscount(data);
};

export const getListLogic = async () => {
    return await fetchAllDiscounts();
};

export const updateLogic = async (id, data) => {
    // 1. Kiểm tra xem mã giảm giá này có tồn tại không
    const currentDiscount = await fetchDiscountById(id);
    if (!currentDiscount) {
        throw new Error('Không tìm thấy mã giảm giá này.');
    }

    // 2. Kiểm tra trùng code
    data.code = data.code.toUpperCase();
    const isCodeExist = await checkCodeExists(data.code, id);
    if (isCodeExist) {
        throw new Error(`Mã giảm giá '${data.code}' đã bị trùng với một mã khác trong hệ thống.`);
    }

    // 3. TỰ ĐỘNG tính trạng thái theo ngày — không cần chờ cron
    //    Nếu admin chỉnh end_date sang tương lai => tự động mở lại
    //    Nếu admin chỉnh end_date sang quá khứ  => tự động khóa ngay
    const autoStatus = computeAutoStatus(data.start_date, data.end_date);
    if (autoStatus !== null) {
        data.is_active = autoStatus;
    }

    // 4. Tiến hành cập nhật
    return await updateDiscountById(id, data);
};

export const deleteLogic = async (id) => {
    const currentDiscount = await fetchDiscountById(id);
    if (!currentDiscount) {
        throw new Error('Không tìm thấy mã giảm giá này.');
    }
    return await deleteDiscountById(id);
};
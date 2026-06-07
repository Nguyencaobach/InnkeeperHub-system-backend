import { 
    checkProductExists, checkBatchCodeExists, insertBatch, 
    fetchBatchesByProductId, fetchBatchById, updateBatchById, deleteBatchById 
} from './product-batch.model.js';

// Hàm phụ trợ: Tự động tạo mã lô (Ví dụ: LO123456)
const generateBatchCode = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); 
    return `LO${randomNum}`;
};

// =========================================================
// HELPER: Tính trạng thái lô hàng tự động dựa vào exp_date (giờ VN)
// =========================================================
const computeBatchAutoStatus = (exp_date, userStatus) => {
    if (!exp_date) return userStatus; // Không có HSD → giữ nguyên lựa chọn của user

    // Lấy ngày hiện tại theo giờ Việt Nam (UTC+7), chuẩn hóa về midnight
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const today = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate());

    // Joi validation đã convert "YYYY-MM-DD" thành Date Object (UTC midnight)
    // → Phải dùng getUTC* để lấy đúng ngày, không bị lệch múi giờ
    let exp;
    if (exp_date instanceof Date) {
        exp = new Date(exp_date.getUTCFullYear(), exp_date.getUTCMonth(), exp_date.getUTCDate());
    } else {
        // Trường hợp vẫn là string "YYYY-MM-DD"
        const [y, m, d] = String(exp_date).substring(0, 10).split('-').map(Number);
        exp = new Date(y, m - 1, d);
    }

    // Hết hạn sử dụng → KHÓA ngay, không cần chờ cron
    if (exp < today) return 'LOCKED';

    // Còn hạn → ACTIVE (dù user có đang để LOCKED do ngày cũ)
    return 'ACTIVE';
};

// =========================================================

export const createLogic = async (data) => {
    // 1. Kiểm tra sản phẩm có tồn tại không
    const isProductExist = await checkProductExists(data.product_id);
    if (!isProductExist) throw new Error('Sản phẩm không tồn tại trong hệ thống.');

    // 2. Xử lý Mã lô hàng
    if (!data.batch_code || data.batch_code.trim() === '') {
        data.batch_code = generateBatchCode();
    }

    // 3. Kiểm tra trùng mã lô
    const isBatchExist = await checkBatchCodeExists(data.batch_code);
    if (isBatchExist) throw new Error(`Mã lô hàng (${data.batch_code}) đã tồn tại. Vui lòng nhập mã khác.`);

    // 4. Số lượng còn lại = Số lượng ban đầu khi mới nhập
    data.remain_quantity = data.original_quantity;

    // 5. Xử lý ngày rỗng
    if (!data.mfg_date) data.mfg_date = null;
    if (!data.exp_date) data.exp_date = null;

    // 6. TỰ ĐỘNG tính trạng thái theo HSD — không cần chờ cron
    //    Nếu nhập lô với HSD đã qua => tự động LOCKED ngay
    data.status = computeBatchAutoStatus(data.exp_date, data.status);

    return await insertBatch(data);
};

export const getListLogic = async (productId) => {
    if (!productId) throw new Error('Vui lòng cung cấp mã sản phẩm (product_id).');
    return await fetchBatchesByProductId(productId);
};

export const updateLogic = async (id, data) => {
    const currentBatch = await fetchBatchById(id);
    if (!currentBatch) throw new Error('Không tìm thấy lô hàng này.');

    // Nếu người dùng xóa trắng mã lô lúc cập nhật, lấy lại mã cũ
    if (!data.batch_code || data.batch_code.trim() === '') {
        data.batch_code = currentBatch.batch_code;
    }

    const isBatchExist = await checkBatchCodeExists(data.batch_code, id);
    if (isBatchExist) throw new Error(`Mã lô hàng (${data.batch_code}) đã bị trùng với lô khác.`);

    // Xử lý các ngày tháng rỗng
    if (!data.mfg_date) data.mfg_date = null;
    if (!data.exp_date) data.exp_date = null;

    // Giữ lại số lượng còn lại từ DB nếu không được gửi lên
    if (data.remain_quantity === undefined || data.remain_quantity === null) {
        data.remain_quantity = currentBatch.remain_quantity;
    }

    // TỰ ĐỘNG tính trạng thái theo HSD — không cần chờ cron
    //    Chỉnh HSD sang quá khứ  → LOCKED ngay
    //    Chỉnh HSD sang tương lai → ACTIVE ngay (mở lại)
    data.status = computeBatchAutoStatus(data.exp_date, data.status);

    return await updateBatchById(id, data);
};

export const deleteLogic = async (id) => {
    const currentBatch = await fetchBatchById(id);
    if (!currentBatch) throw new Error('Không tìm thấy lô hàng này.');
    return await deleteBatchById(id);
};
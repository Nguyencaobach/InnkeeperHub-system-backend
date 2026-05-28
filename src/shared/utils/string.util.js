/**
 * Loại bỏ toàn bộ dấu Tiếng Việt, chuyển về chữ thường
 * Output: "Nguyễn Văn A" -> "nguyen van a"
 */
export const removeVietnameseTones = (str) => {
    if (!str) return "";
    
    return str
        .normalize('NFD') // Phân tách chữ và dấu
        .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu
        .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý chữ đ đặc biệt
        .trim()
        .toLowerCase();
};

/**
 * Chuyển tiêu đề thành dạng đường dẫn (URL Slug)
 * Output: "Phòng VIP Số 1" -> "phong-vip-so-1"
 */
export const generateSlug = (str) => {
    const noTones = removeVietnameseTones(str);
    return noTones
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
        .replace(/[^a-z0-9-]/g, ''); // Xóa các ký tự đặc biệt
};
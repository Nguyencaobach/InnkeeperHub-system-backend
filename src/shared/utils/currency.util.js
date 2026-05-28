/**
 * Định dạng số thành tiền tệ Việt Nam (VD: 1000000 -> "1.000.000 ₫")
 */
export const formatVND = (amount) => {
    if (isNaN(amount)) return "0 ₫";
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

/**
 * Định dạng số thành chuỗi không có ký hiệu đằng sau (VD: 1000000 -> "1.000.000")
 * Dùng khi xuất file Excel hoặc báo cáo
 */
export const formatNumberVN = (amount) => {
    if (isNaN(amount)) return "0";
    return new Intl.NumberFormat('vi-VN').format(amount);
};
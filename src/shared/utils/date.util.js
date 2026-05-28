/**
 * Chuyển đổi một chuỗi ngày hoặc Object Date sang định dạng ngày giờ Việt Nam
 * Output: "25/12/2023, 14:30:00"
 */
export const formatVNDateTime = (dateInput) => {
    if (!dateInput) return null;
    
    const date = new Date(dateInput);
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', // Ép cứng múi giờ VN
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Dùng định dạng 24h
    }).format(date);
};

/**
 * Chỉ lấy ngày tháng năm (VD: "25/12/2023")
 */
export const formatVNDate = (dateInput) => {
    if (!dateInput) return null;
    
    const date = new Date(dateInput);
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
};
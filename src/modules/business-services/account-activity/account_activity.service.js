import { insertLog, fetchAllLogs, deleteLogsBefore } from './account_activity.model.js';

export const createLogic = async (data, userTokenInfo) => {
    // Tự động gắn thông tin người dùng đang thực hiện hành động từ Token
    if (userTokenInfo) {
        data.user_id = userTokenInfo.user_id || userTokenInfo.id; 
        data.username = userTokenInfo.username;
    }

    // Nếu details được gửi lên là chuỗi (string) thì thử parse sang JSON Object
    if (data.details && typeof data.details === 'string') {
        try {
            data.details = JSON.parse(data.details);
        } catch (error) {
            // Nếu không parse được thì giữ nguyên là chuỗi bỏ vào object
            data.details = { note: data.details };
        }
    }

    return await insertLog(data);
};

export const getListLogic = async (limit, offset) => {
    return await fetchAllLogs(limit, offset);
};

export const deleteLogsBeforeLogic = async (beforeDate) => {
    // Validate: ngày phải hợp lệ
    const parsed = new Date(beforeDate);
    if (isNaN(parsed.getTime())) {
        throw new Error('Ngày không hợp lệ.');
    }
    // Không cho xóa log của hôm nay trở đi (chỉ xóa dữ liệu cũ)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed >= today) {
        throw new Error('Chỉ được xóa log cũ hơn ngày hôm nay.');
    }
    const deletedCount = await deleteLogsBefore(beforeDate);
    return { deletedCount };
};
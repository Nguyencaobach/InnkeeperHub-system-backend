import { getDashboardLogic, discardBatchLogic } from './warehouse_status.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { logActivity } from '../../../../shared/utils/activity.helper.js';

export const getWarehouseDashboard = async (req, res) => {
    try {
        const result = await getDashboardLogic();
        return sendSuccess(res, result, "Lấy dữ liệu tình trạng kho thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

export const discardBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { reason } = req.body; // Lấy lý do tiêu hủy (Đã qua Joi kiểm tra ở Route)

        const result = await discardBatchLogic(batchId);

        // Ghi vào Nhật ký hệ thống
        logActivity(
            req.user, 
            'DELETE', 
            'Lô hàng tồn đọng', 
            `Mã lô: ${result.batch_code}`, 
            { note: `Tiêu hủy hàng hóa. Lý do: ${reason}` }
        );

        return sendSuccess(res, result, "Đã tiêu hủy lô hàng thành công", STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};
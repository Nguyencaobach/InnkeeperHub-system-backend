import RevenueModel from './revenue.model.js';
import { STATUS_CODES, sendSuccess, sendError } from '../../../shared/utils/response.util.js';

class RevenueController {
    // 1. Thống kê tổng quan (Summary)
    async getSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return sendError(res, "Thiếu tham số startDate hoặc endDate", STATUS_CODES.BAD_REQUEST);
            }
            
            const summary = await RevenueModel.getSummary(startDate, endDate);
            return sendSuccess(res, summary, "Lấy tóm tắt doanh thu thành công");
        } catch (error) {
            console.error("Lỗi getSummary:", error);
            return sendError(res, "Lỗi máy chủ", STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // 2. Dữ liệu biểu đồ doanh thu theo thời gian
    async getRevenueTimeline(req, res) {
        try {
            const { startDate, endDate, groupBy } = req.query;
            if (!startDate || !endDate) {
                return sendError(res, "Thiếu tham số startDate hoặc endDate", STATUS_CODES.BAD_REQUEST);
            }
            
            const timeline = await RevenueModel.getRevenueTimeline(startDate, endDate, groupBy || 'day');
            return sendSuccess(res, timeline, "Lấy dữ liệu biểu đồ thành công");
        } catch (error) {
            console.error("Lỗi getRevenueTimeline:", error);
            return sendError(res, "Lỗi máy chủ", STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // 3. Phân bổ phương thức thanh toán
    async getPaymentMethodsDist(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return sendError(res, "Thiếu tham số startDate hoặc endDate", STATUS_CODES.BAD_REQUEST);
            }
            
            const dist = await RevenueModel.getPaymentMethodsDist(startDate, endDate);
            return sendSuccess(res, dist, "Lấy dữ liệu phương thức thanh toán thành công");
        } catch (error) {
            console.error("Lỗi getPaymentMethodsDist:", error);
            return sendError(res, "Lỗi máy chủ", STATUS_CODES.INTERNAL_ERROR);
        }
    }

    // 4. (Tuỳ chọn) Top phòng mang lại doanh thu cao nhất
    async getTopRooms(req, res) {
        try {
            const { startDate, endDate, limit } = req.query;
            if (!startDate || !endDate) {
                return sendError(res, "Thiếu tham số startDate hoặc endDate", STATUS_CODES.BAD_REQUEST);
            }
            
            const rooms = await RevenueModel.getTopRooms(startDate, endDate, limit ? parseInt(limit) : 5);
            return sendSuccess(res, rooms, "Lấy dữ liệu phòng thành công");
        } catch (error) {
            console.error("Lỗi getTopRooms:", error);
            return sendError(res, "Lỗi máy chủ", STATUS_CODES.INTERNAL_ERROR);
        }
    }
}

export default new RevenueController();

import { getAllBillsLogic, getBillByIdLogic, deleteBillLogic } from './bill_payments.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../shared/middlewares/cache.middleware.js';

// ── GET /api/bill-payments ─────────────────────────────────────────
export const getAllBills = async (req, res) => {
    try {
        const { search, dateFrom, dateTo } = req.query;
        const limit  = req.query.limit  ? parseInt(req.query.limit)  : 50;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;

        const result = await getAllBillsLogic({ search, dateFrom, dateTo, limit, offset });
        return sendSuccess(res, result, 'Lấy danh sách hóa đơn thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

// ── GET /api/bill-payments/:id ────────────────────────────────────
export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getBillByIdLogic(id);
        return sendSuccess(res, result, 'Lấy chi tiết hóa đơn thành công', STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.NOT_FOUND);
    }
};

// ── DELETE /api/bill-payments/:id ─────────────────────────────────
export const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteBillLogic(id);
        await invalidateCache('bill-payments:*');
        return sendSuccess(res, result, `Đã xóa hóa đơn ${id}`, STATUS_CODES.OK);
    } catch (error) {
        return sendError(res, error.message, STATUS_CODES.BAD_REQUEST);
    }
};

import { fetchAllBills, fetchBillById, deleteBillById } from './bill_payments.model.js';

// ── 1. Lấy danh sách ─────────────────────────────────────────────
export const getAllBillsLogic = async ({ search, dateFrom, dateTo, limit, offset }) => {
    return await fetchAllBills({ search, dateFrom, dateTo, limit, offset });
};

// ── 2. Lấy chi tiết 1 hóa đơn ────────────────────────────────────
export const getBillByIdLogic = async (id) => {
    const bill = await fetchBillById(id);
    if (!bill) throw new Error(`Không tìm thấy hóa đơn với mã: ${id}`);
    return bill;
};

// ── 3. Xóa hóa đơn ───────────────────────────────────────────────
export const deleteBillLogic = async (id) => {
    const deleted = await deleteBillById(id);
    if (!deleted) throw new Error(`Không tìm thấy hóa đơn với mã: ${id}`);
    return { deleted_id: deleted.id };
};

import {
    getProductsByCategoryService,
    getServiceItemsService,
    addInventoryItemService,
    removeServiceItemService,
    getServiceCategoriesService,
    getServicesByCategoryService,
    addGeneralServiceService,
    updateQuantityService,
} from './booking-service-item.service.js';
import { sendSuccess, sendError, STATUS_CODES } from '../../../../shared/utils/response.util.js';
import { invalidateCache } from '../../../../shared/middlewares/cache.middleware.js';

// GET /api/booking-service-items/products?categoryId=xxx
export const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.query;
        const result = await getProductsByCategoryService(categoryId);
        return sendSuccess(res, result, 'Lấy danh sách sản phẩm thành công');
    } catch (err) {
        return sendError(res, err.message, STATUS_CODES.BAD_REQUEST);
    }
};

// GET /api/booking-service-items/:bookingId
export const getServiceItems = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const result = await getServiceItemsService(bookingId);
        return sendSuccess(res, result, 'Lấy danh sách dịch vụ thành công');
    } catch (err) {
        return sendError(res, err.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

// POST /api/booking-service-items/:bookingId/inventory
export const addInventoryItem = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const result = await addInventoryItemService(bookingId, req.body);
        await invalidateCache('bsi:*', 'products:*', 'customer:*bsi:*', 'customer:*products:*');
        return sendSuccess(res, result, 'Thêm hàng hóa thành công', STATUS_CODES.CREATED);
    } catch (err) {
        const status = err.message.includes('Không đủ tồn kho')
            ? STATUS_CODES.CONFLICT
            : STATUS_CODES.BAD_REQUEST;
        return sendError(res, err.message, status);
    }
};

// DELETE /api/booking-service-items/item/:serviceItemId
export const deleteServiceItem = async (req, res) => {
    try {
        const { serviceItemId } = req.params;
        const result = await removeServiceItemService(serviceItemId);
        await invalidateCache('bsi:*', 'products:*', 'customer:*bsi:*', 'customer:*products:*');
        return sendSuccess(res, result, 'Đã xóa dịch vụ thành công');
    } catch (err) {
        return sendError(res, err.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

// GET /api/booking-service-items/service-categories
export const getServiceCategories = async (req, res) => {
    try {
        const result = await getServiceCategoriesService();
        return sendSuccess(res, result, 'Lấy danh mục dịch vụ thành công');
    } catch (err) {
        return sendError(res, err.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

// GET /api/booking-service-items/services?category=xxx
export const getServicesByCategory = async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) return sendError(res, 'Thiếu category.', STATUS_CODES.BAD_REQUEST);
        const result = await getServicesByCategoryService(category);
        return sendSuccess(res, result, 'Lấy danh sách dịch vụ thành công');
    } catch (err) {
        return sendError(res, err.message, STATUS_CODES.INTERNAL_ERROR);
    }
};

// POST /api/booking-service-items/:bookingId/general
export const addGeneralService = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const result = await addGeneralServiceService(bookingId, req.body);
        await invalidateCache('bsi:*', 'customer:*bsi:*');
        return sendSuccess(res, result, 'Thêm dịch vụ thành công', STATUS_CODES.CREATED);
    } catch (err) {
        return sendError(res, err.message, STATUS_CODES.BAD_REQUEST);
    }
};

// PATCH /api/booking-service-items/item/:serviceItemId/quantity
export const updateItemQuantity = async (req, res) => {
    try {
        const { serviceItemId } = req.params;
        const { quantity } = req.body;
        const result = await updateQuantityService(serviceItemId, quantity);
        await invalidateCache('bsi:*', 'customer:*bsi:*');
        return sendSuccess(res, result, 'Cập nhật số lượng thành công');
    } catch (err) {
        const status = err.message.includes('Không đủ tồn kho')
            ? STATUS_CODES.CONFLICT
            : STATUS_CODES.BAD_REQUEST;
        return sendError(res, err.message, status);
    }
};

import { api } from "./api";

/* ================= SHOP ORDER APIs ================= */
/* Uses /api/shop/orders — requires shop owner auth */

/**
 * GET SHOP ORDERS
 * GET /api/shop/orders?status=pending&page=1&limit=20
 */
export const getShopOrders = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return api.get("/shop/orders", { params });
};

/**
 * GET SHOP ORDER BY ID
 * GET /api/shop/orders/:id
 */
export const getShopOrderById = (orderId: string) => {
  return api.get(`/shop/orders/${orderId}`);
};

/**
 * ACCEPT ORDER
 * PATCH /api/shop/orders/:id/accept
 */
export const acceptOrder = (orderId: string) => {
  return api.patch(`/shop/orders/${orderId}/accept`);
};

/**
 * REJECT ORDER
 * PATCH /api/shop/orders/:id/reject
 */
export const rejectOrder = (orderId: string) => {
  return api.patch(`/shop/orders/${orderId}/reject`);
};

/**
 * UPDATE ORDER STATUS
 * PATCH /api/shop/orders/:id/status
 */
export const updateOrderStatus = (orderId: string, status: string) => {
  return api.patch(`/shop/orders/${orderId}/status`, { status });
};

/**
 * CREATE BILL FROM ORDER
 * POST /api/shop/orders/:id/create-bill
 */
export const createBillFromOrder = (
  orderId: string,
  data?: {
    paymentMode?: string;
    paidAmount?: number;
    discount?: number;
    taxPercentage?: number;
  }
) => {
  return api.post(`/shop/orders/${orderId}/create-bill`, data || {});
};

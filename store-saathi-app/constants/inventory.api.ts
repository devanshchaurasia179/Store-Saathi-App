import { api } from "./api";

/* =========================
   INVENTORY / PRODUCTS
========================= */

// Get all products
export const getProducts = () => api.get("/products");

// Create product (manual / quick add)
export const createProduct = (data) =>
  api.post("/products", data);

// Barcode scan lookup
export const getProductByBarcode = (barcode) =>
  api.get(`/products/barcode/${barcode}`);

// Get single product
export const getProductById = (productId) =>
  api.get(`/products/${productId}`);

// Update product
export const updateProduct = (productId, data) =>
  api.put(`/products/${productId}`, data);

// Delete product
export const deleteProduct = (productId) =>
  api.delete(`/products/${productId}`);

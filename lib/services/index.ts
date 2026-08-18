/**
 * Export all API services
 */

export { authService, default as AuthService } from './auth-service';
export type { LoginRequest, RegisterRequest, AuthResponse } from './auth-service';

export { orderService, default as OrderService } from './order-service';
export type { OrderItem, CreateOrderRequest, OrderResponse } from './order-service';

export { productService, default as ProductService } from './product-service';
export type { Product, Flavour } from './product-service';

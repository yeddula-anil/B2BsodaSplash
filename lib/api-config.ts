/**
 * API Configuration and Constants
 * Central place for managing API endpoints and configuration via API Gateway
 */

const getGatewayBaseUrl = (): string => {
  const url =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
    process.env.GATEWAY_URL ||
    'http://localhost:8080/api';
  return url.replace(/\/+$/, '');
};

export const GATEWAY_URL = getGatewayBaseUrl();

export const AUTH_SERVICE_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || process.env.AUTH_SERVICE_URL || GATEWAY_URL;

export const ORDERS_SERVICE_URL =
  process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || process.env.ORDERS_SERVICE_URL || GATEWAY_URL;

export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || process.env.PRODUCT_SERVICE_URL || GATEWAY_URL;

export const API_ENDPOINTS = {
  // Auth Service (routed via Gateway)
  AUTH: {
    REGISTER: `${GATEWAY_URL}/auth/register`,
    LOGIN: `${GATEWAY_URL}/auth/login`,
    GOOGLE_LOGIN: `${GATEWAY_URL}/auth/google`,
    LOGOUT: `${GATEWAY_URL}/auth/logout`,
    REFRESH: `${GATEWAY_URL}/auth/refresh`,
    STAFF_LIST: `${GATEWAY_URL}/auth/staff`,
    BD_USERS: `${GATEWAY_URL}/auth/users/bd`,
  },

  // Orders Service (routed via Gateway)
  ORDERS: {
    CREATE: `${GATEWAY_URL}/orders`,
    LIST: `${GATEWAY_URL}/orders`,
    LIST_MY: `${GATEWAY_URL}/orders/user`,
    GET_BY_ID: (id: string) => `${GATEWAY_URL}/orders/${id}`,
    UPDATE_STATUS: (id: string) => `${GATEWAY_URL}/orders/${id}/status`,
    UPDATE_AMOUNT: (id: string) => `${GATEWAY_URL}/orders/${id}/final-amount`,
    STAFF_LIST: `${GATEWAY_URL}/orders/staff`,
    BY_EMAIL: (email: string) => `${GATEWAY_URL}/orders/by-email?email=${encodeURIComponent(email)}`,
    BY_REFERRAL: (email: string) => `${GATEWAY_URL}/orders/by-referral-email?email=${encodeURIComponent(email)}`,
  },

  // Products Service (routed via Gateway)
  PRODUCTS: {
    LIST: `${GATEWAY_URL}/products`,
    GET_BY_ID: (id: string) => `${GATEWAY_URL}/products/${id}`,
    CREATE: `${GATEWAY_URL}/products`,
    UPDATE: (id: string) => `${GATEWAY_URL}/products/${id}`,
    DELETE: (id: string) => `${GATEWAY_URL}/products/${id}`,
  },

  // Flavours Service (routed via Gateway)
  FLAVOURS: {
    LIST: `${GATEWAY_URL}/products/flavours`,
    GET_BY_ID: (id: string) => `${GATEWAY_URL}/products/flavours/${id}`,
  },

  // Staff Service
  STAFF: {
    LOGIN: `${GATEWAY_URL}/auth/staff`,
    GET_PROFILE: `${GATEWAY_URL}/auth/staff/profile`,
  },
};

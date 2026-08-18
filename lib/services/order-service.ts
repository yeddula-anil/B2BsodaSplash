/**
 * Order Service API
 * Handles order-related API calls
 */

import { apiClient, ApiResponse } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface OrderItem {
  productId: string;
  flavourId: string;
  quantity: number;
  pricePerCase?: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  items: OrderItem[];
  specialRequests?: string;
}

export interface OrderResponse {
  id: string;
  quoteNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  status: string;
  totalAmount?: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<OrderResponse>> {
    return apiClient.post<OrderResponse>(API_ENDPOINTS.ORDERS.CREATE, data);
  }

  /**
   * Get all orders for the current user
   */
  async getMyOrders(): Promise<ApiResponse<OrderResponse[]>> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return { error: 'User not authenticated' };
    }
    return apiClient.get<OrderResponse[]>(`${API_ENDPOINTS.ORDERS.LIST_MY}/${userId}`);
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<ApiResponse<OrderResponse>> {
    return apiClient.get<OrderResponse>(API_ENDPOINTS.ORDERS.GET_BY_ID(orderId));
  }

  /**
   * Update order status (admin/staff only)
   */
  async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<ApiResponse<OrderResponse>> {
    return apiClient.patch<OrderResponse>(
      API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
      { status }
    );
  }

  /**
   * Update final amount (admin/staff only)
   */
  async updateFinalAmount(
    orderId: string,
    finalAmount: number
  ): Promise<ApiResponse<OrderResponse>> {
    return apiClient.patch<OrderResponse>(
      API_ENDPOINTS.ORDERS.UPDATE_AMOUNT(orderId),
      { finalAmount }
    );
  }

  /**
   * Get staff dashboard orders
   */
  async getStaffOrders(
    staffId: string,
    staffRole: string
  ): Promise<ApiResponse<OrderResponse[]>> {
    return apiClient.get<OrderResponse[]>(
      API_ENDPOINTS.ORDERS.STAFF_LIST,
      {
        'X-Staff-Id': staffId,
        'X-Staff-Role': staffRole,
      }
    );
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).id : null;
  }
}

export const orderService = new OrderService();
export default OrderService;

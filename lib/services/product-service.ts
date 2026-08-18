/**
 * Product Service API
 * Handles product and flavour-related API calls
 */

import { apiClient, ApiResponse } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface Product {
  id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flavour {
  id: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
  availability?: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProductService {
  /**
   * Get all products
   */
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.LIST);
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.GET_BY_ID(productId));
  }

  /**
   * Create new product (admin only)
   */
  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.CREATE, data);
  }

  /**
   * Update product (admin only)
   */
  async updateProduct(
    productId: string,
    data: Partial<Product>
  ): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(productId), data);
  }

  /**
   * Delete product (admin only)
   */
  async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.PRODUCTS.DELETE(productId));
  }

  /**
   * Get all flavours
   */
  async getFlavours(): Promise<ApiResponse<Flavour[]>> {
    return apiClient.get<Flavour[]>(API_ENDPOINTS.FLAVOURS.LIST);
  }

  /**
   * Get flavour by ID
   */
  async getFlavourById(flavourId: string): Promise<ApiResponse<Flavour>> {
    return apiClient.get<Flavour>(API_ENDPOINTS.FLAVOURS.GET_BY_ID(flavourId));
  }
}

export const productService = new ProductService();
export default ProductService;

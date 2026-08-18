/**
 * Auth Service API
 */

import { apiClient, ApiResponse } from '../api-client';
import { API_ENDPOINTS } from '../api-config';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  id: string | number;
  username: string;
  email: string;
  role: string;
  token?: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  async getStaffList(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(API_ENDPOINTS.AUTH.STAFF_LIST);
  }

  async getBdUsers(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(API_ENDPOINTS.AUTH.BD_USERS);
  }
}

export function getJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getStaffFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = getJwtPayload(token);
  if (!payload) return null;

  const role = String(payload.role || payload.roles || "").toUpperCase();
  if (role !== "ADMIN" && role !== "BD") return null;

  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email,
    role: role.toLowerCase(),
    token
  };
}

export const authService = new AuthService();
export default AuthService;
// ════ API Client ════
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { liffService } from './liff';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor - add LIFF token
    this.client.interceptors.request.use(
      async (config) => {
        const token = liffService.getIDToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - force re-login
          console.error('[API] Unauthorized, please login again');
          liffService.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // ── Sessions ──
  async getSessions(params?: { filter?: string; status?: string }) {
    const { data } = await this.client.get('/api/sessions', { params });
    return data;
  }

  async getSession(id: string) {
    const { data } = await this.client.get(`/api/sessions/${id}`);
    return data;
  }

  async createSession(session: Record<string, unknown>) {
    const { data } = await this.client.post('/api/sessions', session);
    return data;
  }

  async updateSession(id: string, updates: Record<string, unknown>) {
    const { data } = await this.client.patch(`/api/sessions/${id}`, updates);
    return data;
  }

  async deleteSession(id: string) {
    const { data } = await this.client.delete(`/api/sessions/${id}`);
    return data;
  }

  // ── Registrations ──
  async register(sessionId: string, paymentMethod: string) {
    const { data } = await this.client.post('/api/registrations', {
      sessionId,
      paymentMethod,
    });
    return data;
  }

  async getSessionRegistrations(sessionId: string) {
    const { data } = await this.client.get(`/api/registrations/session/${sessionId}`);
    return data;
  }

  async cancelRegistration(registrationId: string) {
    const { data } = await this.client.delete(`/api/registrations/${registrationId}`);
    return data;
  }

  async updatePaymentStatus(registrationId: string, paidStatus: string) {
    const { data } = await this.client.patch(`/api/registrations/${registrationId}/payment`, {
      paidStatus,
    });
    return data;
  }

  // ── Matches ──
  async getMatches(sessionId: string, status?: string) {
    const { data } = await this.client.get(`/api/matches/session/${sessionId}`, {
      params: { status },
    });
    return data;
  }

  async createMatches(sessionId: string, params: {
    mode: string;
    courtCount: number;
    matchType?: string;
  }) {
    const { data } = await this.client.post(`/api/matches/session/${sessionId}`, params);
    return data;
  }

  async updateMatch(matchId: string, updates: {
    score1?: number;
    score2?: number;
    status?: string;
  }) {
    const { data } = await this.client.patch(`/api/matches/${matchId}`, updates);
    return data;
  }

  async deleteMatch(matchId: string) {
    const { data } = await this.client.delete(`/api/matches/${matchId}`);
    return data;
  }

  // ── Payments ──
  async getBilling(sessionId: string) {
    const { data } = await this.client.get(`/api/payments/session/${sessionId}`);
    return data;
  }

  async notifyAllPlayers(sessionId: string, liffUrl?: string) {
    const { data } = await this.client.post(`/api/payments/session/${sessionId}/notify-all`, {
      liffUrl,
    });
    return data;
  }

  async uploadSlip(registrationId: string, slipUrl: string) {
    const { data } = await this.client.post(`/api/payments/registration/${registrationId}/upload-slip`, {
      slipUrl,
    });
    return data;
  }

  async approvePayment(registrationId: string) {
    const { data } = await this.client.patch(`/api/payments/registration/${registrationId}/approve`);
    return data;
  }

  // ── Stats ──
  async getSessionStats(sessionId: string) {
    const { data } = await this.client.get(`/api/stats/session/${sessionId}`);
    return data;
  }

  async getLeaderboard(period?: string) {
    const { data } = await this.client.get('/api/stats/leaderboard', {
      params: { period },
    });
    return data;
  }

  async getPlayerStats(userId: string) {
    const { data } = await this.client.get(`/api/stats/player/${userId}`);
    return data;
  }

  // ── Admin ──
  async getAdminUsers() {
    const { data } = await this.client.get('/api/admin/users');
    return data;
  }

  async updateAdminUser(userId: string, updates: Record<string, unknown>) {
    const { data } = await this.client.patch(`/api/admin/users/${userId}`, updates);
    return data;
  }

  async getAdminDashboard() {
    const { data } = await this.client.get('/api/admin/dashboard');
    return data;
  }

  async endSession(sessionId: string) {
    const { data } = await this.client.post(`/api/admin/sessions/${sessionId}/end`);
    return data;
  }
}

export const api = new ApiClient();
export default api;

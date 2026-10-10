import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPesapalConfig,
  getPesapalToken,
  submitPesapalOrder,
  getPesapalTransactionStatus,
  _resetInMemoryPesapalState,
} from "../src/pesapal";

describe("Pesapal Service Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetInMemoryPesapalState();
  });

  it("resolves default sandbox config when env vars are not set", () => {
    const cfg = getPesapalConfig({} as any);
    expect(cfg.envMode).toBe("sandbox");
    expect(cfg.baseUrl).toBe("https://cybqa.pesapal.com/pesapalv3");
    expect(cfg.key).toBe("TDpigBOOhs+zAl8cwH2Fl82jJGyD8xev");
    expect(cfg.secret).toBe("1KpqkfsMaihIcOlhnBo/gBZ5smw=");
  });

  it("resolves live URL when PESAPAL_ENV is live", () => {
    const cfg = getPesapalConfig({ PESAPAL_ENV: "live" } as any);
    expect(cfg.envMode).toBe("live");
    expect(cfg.baseUrl).toBe("https://pay.pesapal.com/v3");
  });

  it("parses simulated transaction status correctly", async () => {
    const status = await getPesapalTransactionStatus({} as any, "trk_sim_12345");
    expect(status.isCompleted).toBe(true);
    expect(status.statusCode).toBe(1);
    expect(status.statusDescription).toBe("Completed");
    expect(status.paymentMethod).toContain("Simulated");
  });

  it("submits order and falls back to simulation gracefully if network fetch fails", async () => {
    const mockEnv = {
      BLUEPRINTS: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    const result = await submitPesapalOrder({
      env: mockEnv,
      origin: "https://voltrix.stream",
      merchantRef: "ORD-TEST-999",
      currency: "UGX",
      amount: 35000,
      description: "Scholar Pro Test",
      email: "scholar@voltrix.stream",
      phone: "0770123456",
      firstName: "Test",
      lastName: "User",
      countryCode: "UG",
    });

    expect(result).toBeDefined();
    expect(result.merchant_reference).toBe("ORD-TEST-999");
    expect(result.order_tracking_id).toBeDefined();
    expect(result.redirect_url).toBeDefined();
  });

  it("handles successful status response parsing", async () => {
    const mockEnv = {
      BLUEPRINTS: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      },
      PESAPAL_CONSUMER_KEY: "test-key",
      PESAPAL_CONSUMER_SECRET: "test-secret",
    } as any;

    // Mock fetch for RequestToken and GetTransactionStatus
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/Auth/RequestToken")) {
        return new Response(JSON.stringify({ token: "mock-jwt-token", expiryDate: new Date(Date.now() + 300000).toISOString() }), { status: 200 });
      }
      if (urlStr.includes("/api/Transactions/GetTransactionStatus")) {
        return new Response(JSON.stringify({
          payment_method: "MTN Mobile Money",
          amount: 35000,
          confirmation_code: "MM123456",
          order_tracking_id: "test-track-id",
          payment_status_description: "Completed",
          status_code: 1,
          merchant_reference: "ORD-123",
          currency: "UGX",
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    });

    const status = await getPesapalTransactionStatus(mockEnv, "test-track-id");
    expect(status.isCompleted).toBe(true);
    expect(status.statusCode).toBe(1);
    expect(status.statusDescription).toBe("Completed");
    expect(status.paymentMethod).toBe("MTN Mobile Money");
    expect(status.confirmationCode).toBe("MM123456");
  });

  it("retrieves and caches Pesapal auth token", async () => {
    const mockEnv = {
      BLUEPRINTS: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      },
      PESAPAL_CONSUMER_KEY: "test-key",
      PESAPAL_CONSUMER_SECRET: "test-secret",
    } as any;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/Auth/RequestToken")) {
        return new Response(
          JSON.stringify({
            token: "fresh-jwt-token",
            expiryDate: new Date(Date.now() + 300000).toISOString(),
            status: "200",
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    });

    const token = await getPesapalToken(mockEnv);
    expect(token).toBe("fresh-jwt-token");
    expect(mockEnv.BLUEPRINTS.put).toHaveBeenCalledWith(
      "sys:pesapal_token",
      expect.stringContaining("fresh-jwt-token"),
      expect.anything()
    );
  });

  it("handles failed or pending transaction status correctly", async () => {
    const mockEnv = {
      BLUEPRINTS: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/Auth/RequestToken")) {
        return new Response(JSON.stringify({ token: "test-token" }), { status: 200 });
      }
      if (urlStr.includes("/api/Transactions/GetTransactionStatus")) {
        return new Response(
          JSON.stringify({
            payment_method: "Airtel Money",
            amount: 35000,
            order_tracking_id: "test-fail-id",
            payment_status_description: "Failed",
            status_code: 2,
            merchant_reference: "ORD-FAIL-1",
            currency: "UGX",
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    });

    const status = await getPesapalTransactionStatus(mockEnv, "test-fail-id");
    expect(status.isCompleted).toBe(false);
    expect(status.isFailed).toBe(true);
    expect(status.statusCode).toBe(2);
    expect(status.statusDescription).toBe("Failed");
  });
});


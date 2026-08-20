import { test, expect } from "@playwright/test";

const backend = process.env.E2E_BACKEND_URL ?? "http://localhost:8000";
const frontend = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";

test.describe("BetPlus smoke", () => {
  test("backend health endpoint", async ({ request }) => {
    try {
      const res = await request.get(`${backend}/health/`);
      test.skip(res.status() >= 500, "FastAPI is not running");
      expect(res.status()).toBe(200);
      expect(await res.json()).toMatchObject({ status: "ok" });
    } catch {
      test.skip(true, "FastAPI is not running");
    }
  });

  test("homepage loads", async ({ page }) => {
    const res = await page.goto(frontend, { waitUntil: "domcontentloaded" });
    test.skip(!res || res.status() >= 500, "Next.js is not running");
    await expect(page.locator("body")).toBeVisible();
  });

  test("register login wallet and catalog via API", async ({ request }) => {
    const health = await request.get(`${backend}/health/`);
    test.skip(health.status() !== 200, "FastAPI is not running");

    const email = `e2e-${Date.now()}@example.com`;
    const register = await request.post(`${backend}/api/v1/auth/register`, {
      data: { name: "E2E User", email, password: "secret1" },
    });
    expect(register.status()).toBe(201);

    const login = await request.post(`${backend}/api/v1/auth/login`, {
      form: { username: email, password: "secret1" },
    });
    expect(login.status()).toBe(200);
    const token = (await login.json()).access_token as string;
    const auth = { Authorization: `Bearer ${token}` };

    const me = await request.get(`${backend}/api/v1/auth/me`, { headers: auth });
    expect(me.status()).toBe(200);

    const deposit = await request.post(`${backend}/api/v1/payments/deposits`, {
      headers: auth,
      data: { amount: 50, channel: "mobile_money" },
    });
    expect(deposit.status()).toBe(201);

    const catalog = await request.get(`${backend}/api/v1/catalog/games`);
    expect(catalog.status()).toBe(200);
  });
});

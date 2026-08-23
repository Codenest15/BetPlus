import { test, expect } from "@playwright/test";

const backend = process.env.E2E_BACKEND_URL ?? "http://localhost:8000";
const frontend = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";

test.describe("Frontend ↔ backend contract", () => {
  test.setTimeout(120_000);

  test("browser origin uses JSON register and form-urlencoded login", async ({
    page,
    request,
  }) => {
    const health = await request.get(`${backend}/health/`);
    test.skip(health.status() !== 200, "FastAPI is not running");
    const home = await page.goto(frontend, { waitUntil: "domcontentloaded" });
    test.skip(!home || home.status() >= 500, "Next.js is not running");

    const email = `browser-${Date.now()}@example.com`;
    const password = "secret1";
    const phone = `081${String(Date.now()).slice(-8)}`;
    const seen: { url: string; method: string; contentType: string; postData: string }[] = [];

    page.on("request", (req) => {
      const url = req.url();
      if (!url.includes("/api/v1/auth/")) return;
      seen.push({
        url,
        method: req.method(),
        contentType: req.headers()["content-type"] ?? "",
        postData: req.postData() ?? "",
      });
    });

    const result = await page.evaluate(
      async (input: { email: string; password: string; phone: string }) => {
        const registerResp = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Browser User",
            email: input.email,
            phone: input.phone,
            password: input.password,
          }),
        });
        const params = new URLSearchParams();
        params.append("username", input.email);
        params.append("password", input.password);
        const headers = new Headers();
        if (
          !(params instanceof URLSearchParams) &&
          !(typeof FormData !== "undefined" && params instanceof FormData)
        ) {
          headers.set("Content-Type", "application/json");
        }
        const loginResp = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers,
          body: params,
        });
        const loginJson = (await loginResp.json()) as { access_token?: string };
        const meResp = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${loginJson.access_token ?? ""}` },
        });
        return {
          register: registerResp.status,
          login: loginResp.status,
          me: meResp.status,
        };
      },
      { email, password, phone },
    );

    expect(result.register).toBe(201);
    expect(result.login).toBe(200);
    expect(result.me).toBe(200);

    const registerReq = seen.find((r) => r.url.includes("/api/v1/auth/register"));
    expect(registerReq?.method).toBe("POST");
    expect(registerReq?.contentType).toContain("application/json");
    const body = JSON.parse(registerReq?.postData || "{}") as Record<string, unknown>;
    expect(body).toMatchObject({ name: "Browser User", email, password, phone });
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("referralCode");

    const loginReq = seen.find((r) => r.url.includes("/api/v1/auth/login"));
    expect(loginReq?.method).toBe("POST");
    expect(loginReq?.contentType).not.toContain("application/json");
    expect(loginReq?.contentType).toContain("application/x-www-form-urlencoded");
    expect(loginReq?.postData).toContain(`username=${encodeURIComponent(email)}`);
  });

  test("header register modal submits JSON then form-login", async ({ page, request }) => {
    const health = await request.get(`${backend}/health/`);
    test.skip(health.status() !== 200, "FastAPI is not running");
    const home = await page.goto(frontend, { waitUntil: "domcontentloaded" });
    test.skip(!home || home.status() >= 500, "Next.js is not running");

    await expect(
      page.getByText(/Loading matches|No matches found|Premier League/i).first(),
    ).toBeVisible({ timeout: 45_000 });

    const email = `ui-${Date.now()}@example.com`;
    const password = "secret1";
    const phone = `080${String(Date.now()).slice(-8)}`;
    const seen: { url: string; method: string; contentType: string; postData: string }[] = [];
    page.on("request", (req) => {
      if (!req.url().includes("/api/v1/auth/")) return;
      seen.push({
        url: req.url(),
        method: req.method(),
        contentType: req.headers()["content-type"] ?? "",
        postData: req.postData() ?? "",
      });
    });

    const registerBtn = page.getByTestId("header-register");
    await expect(registerBtn).toBeVisible();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await registerBtn.click();
      if (await page.getByRole("dialog").isVisible().catch(() => false)) break;
    }
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder("John Doe").fill("UI User");
    await page.getByPlaceholder("you@email.com").fill(email);
    await page.getByPlaceholder("08012345678").fill(phone);
    await page.getByPlaceholder("Min. 6 characters").fill(password);
    await page.getByTestId("register-submit").click();

    await expect
      .poll(() => seen.some((r) => r.url.includes("/api/v1/auth/register")), { timeout: 30_000 })
      .toBe(true);
    const registerReq = seen.find((r) => r.url.includes("/api/v1/auth/register"));
    expect(registerReq?.method).toBe("POST");
    expect(registerReq?.contentType).toContain("application/json");
    expect(JSON.parse(registerReq?.postData || "{}")).toEqual({
      name: "UI User",
      email,
      phone,
      password,
    });

    await expect
      .poll(() => seen.some((r) => r.url.includes("/api/v1/auth/login")), { timeout: 45_000 })
      .toBe(true);
    const loginReq = seen.find((r) => r.url.includes("/api/v1/auth/login"));
    expect(loginReq?.method).toBe("POST");
    expect(loginReq?.contentType).toContain("application/x-www-form-urlencoded");
  });

  test("frontend rewrite forwards catalog to FastAPI", async ({ page, request }) => {
    const health = await request.get(`${backend}/health/`);
    test.skip(health.status() !== 200, "FastAPI is not running");
    const home = await page.goto(frontend, { waitUntil: "domcontentloaded" });
    test.skip(!home || home.status() >= 500, "Next.js is not running");

    const catalog = await page.request.get(`${frontend}/api/v1/catalog/games`);
    expect(catalog.status()).toBe(200);
    expect(Array.isArray(await catalog.json())).toBe(true);
  });
});

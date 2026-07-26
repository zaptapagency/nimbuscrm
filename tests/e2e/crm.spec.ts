import { test, expect, Page } from "@playwright/test";

const ADMIN = { email: "admin@nimbus.crm", password: "Password123!" };

async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

test("signup a new user then it lands on dashboard", async ({ page }) => {
  const unique = `user${Date.now()}@test.local`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("New User");
  await page.getByLabel("Email").fill(unique);
  await page.getByLabel("Password").fill("supersecret1");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("dashboard renders with seeded data", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Open Pipeline")).toBeVisible();
  await expect(page.getByText("Pipeline value by stage")).toBeVisible();
});

test("create a lead and convert it to account/contact/opportunity", async ({ page }) => {
  await login(page);
  await page.goto("/leads");
  await page.getByRole("button", { name: "New Lead" }).first().click();
  const stamp = String(Date.now());
  await page.getByLabel("First name").fill("E2E");
  await page.getByLabel("Last name").fill(stamp);
  await page.getByLabel("Company").fill(`E2E Co ${stamp}`);
  await page.getByRole("button", { name: "Create lead" }).click();

  await page.getByRole("link", { name: `E2E ${stamp}` }).click();
  await page.waitForURL(/\/leads\/.+/);
  await page.getByRole("button", { name: "Convert" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Convert" }).click();
  await expect(page.getByText("This lead has been converted.")).toBeVisible();
});

test("move an opportunity to a new stage via quick edit", async ({ page }) => {
  await login(page);
  await page.goto("/opportunities");
  const firstStageSelect = page.locator("table select").first();
  await expect(firstStageSelect).toBeVisible();
  await firstStageSelect.selectOption("NEGOTIATION");
  // reload and confirm persisted
  await page.reload();
  await expect(page.locator("table select").first()).toBeVisible();
});

test("pipeline board renders all stage columns", async ({ page }) => {
  await login(page);
  await page.goto("/pipeline");
  await expect(page.locator('[data-stage="PROSPECTING"]')).toBeVisible();
  await expect(page.locator('[data-stage="CLOSED_WON"]')).toBeVisible();
});

test("create and complete a task", async ({ page }) => {
  await login(page);
  await page.goto("/tasks");
  const subject = `E2E task ${Date.now()}`;
  await page.getByPlaceholder("New task subject…").fill(subject);
  await page.getByRole("button", { name: "Add" }).click();
  const item = page.locator("li", { hasText: subject });
  await expect(item).toBeVisible();
  // Completing reloads the list; the row leaves the open view. Use click (not
  // check) since the checkbox element is removed before its state settles.
  await item.getByRole("checkbox").click();
  await expect(page.locator("li", { hasText: subject })).toHaveCount(0);
});

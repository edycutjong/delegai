import { test } from "@playwright/test";
import path from "path";

/**
 * DelegAI — Screenshot Capture Script
 *
 * Captures screenshots for the project.
 * Output: DemoStudio/011_DelegAI/screenshots/
 *
 * Usage:
 *   npx playwright test e2e/capture-screenshots.spec.ts --project=chromium
 *
 * Prerequisites:
 *   - Dashboard running on localhost:3000 (npm run dev)
 */

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  "../../../DemoStudio/011_DelegAI/screenshots"
);

const VIEWPORT = { width: 1920, height: 1080 };

test.use({
  viewport: VIEWPORT,
  video: "off",
  launchOptions: { slowMo: 300 },
});

test.describe("DelegAI — Screenshot Capture", () => {

  test("01 — Landing page (full page)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-landing.png"),
      fullPage: true,
    });
  });

  test("02 — Landing page (viewport only)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-landing-viewport.png"),
      fullPage: false,
    });
  });

  test("03 — Dashboard overview", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("load");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-dashboard.png"),
      fullPage: false,
    });
  });

  test("04 — Dashboard full page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-dashboard-full.png"),
      fullPage: true,
    });
  });

  test("05 — Dashboard delegation tree interaction", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("load");
    await page.waitForTimeout(3000);

    // Try to find and interact with the delegation tree
    const tree = page.locator("[class*=delegation], [class*=Delegation], [class*=tree], [class*=Tree]");
    if (await tree.first().isVisible()) {
      await tree.first().hover();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-delegation-tree.png"),
      fullPage: false,
    });
  });

  test("06 — Dashboard budget meters", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("load");
    await page.waitForTimeout(3000);

    // Scroll to budget/agent section
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-budget-meters.png"),
      fullPage: false,
    });
  });

  test("07 — Pitch deck", async ({ page }) => {
    await page.goto("/pitch");
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-pitch.png"),
      fullPage: false,
    });
  });
});

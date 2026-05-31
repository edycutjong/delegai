import { test } from "@playwright/test";
import path from "path";

/**
 * DelegAI — Recording Capture Script
 *
 * Captures video recordings for the YouTube demo video.
 * Output: test-results/ (default playwright behavior)
 *
 * Usage:
 *   npx playwright test e2e/capture-recordings.spec.ts --project=chromium
 *
 * Prerequisites:
 *   - Dashboard running on localhost:3000 (npm run dev)
 */

const VIEWPORT = { width: 1920, height: 1080 };

test.use({
  viewport: VIEWPORT,
  video: { mode: "on", size: VIEWPORT },
  launchOptions: { slowMo: 300 },
});

test.describe("DelegAI — Video Capture", () => {
  // Give it a larger timeout since recordings take longer to process
  test.setTimeout(90000);

  test("01 — Video walkthrough recording", async ({ page }) => {
    // Landing page
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(3000);

    // Slow scroll through landing
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < document.body.scrollHeight; i += 5) {
        window.scrollBy(0, 5);
        await delay(3);
      }
    });
    await page.waitForTimeout(1500);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("load");
    await page.waitForTimeout(4000);

    // Hover over delegation tree nodes
    const nodes = page.locator("[class*=agent], [class*=Agent], [class*=node], [class*=Node]");
    const nodeCount = await nodes.count();
    for (let i = 0; i < Math.min(nodeCount, 6); i++) {
      const node = nodes.nth(i);
      if (await node.isVisible()) {
        await node.hover();
        await page.waitForTimeout(600);
      }
    }

    // Slow scroll through dashboard
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < document.body.scrollHeight; i += 8) {
        window.scrollBy(0, 8);
        await delay(5);
      }
    });
    await page.waitForTimeout(2000);

    // Hover over activity feed items
    const feedItems = page.locator("[class*=activity], [class*=Activity], [class*=feed], [class*=Feed]");
    const feedCount = await feedItems.count();
    for (let i = 0; i < Math.min(feedCount, 4); i++) {
      const item = feedItems.nth(i);
      if (await item.isVisible()) {
        await item.hover();
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(2000);
  });
});

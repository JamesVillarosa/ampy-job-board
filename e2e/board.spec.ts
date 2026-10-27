import { expect, test } from "@playwright/test";

const rows = (page: import("@playwright/test").Page) => page.locator("tbody tr");

test("lists 20 seeded jobs with stats", async ({ page }) => {
  await page.goto("/");
  await expect(rows(page)).toHaveCount(20);
  await expect(page.getByRole("heading", { name: /in the pipeline/i })).toBeVisible();
});

test("filters by status and keeps it in the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Filter by status" }).getByRole("link", { name: /On Hold/ }).click();
  await expect(page).toHaveURL(/status=On\+Hold/);
  const count = await rows(page).count();
  expect(count).toBeGreaterThan(0);
  for (const row of await rows(page).allInnerTexts()) expect(row.toLowerCase()).toContain("on hold");
});

test("searches by customer, case-insensitive, and shows empty state", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search customers" });
  await search.fill("bakery");
  await expect(page).toHaveURL(/q=bakery/);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Golden Square Bakery");

  await search.fill("zzz-nobody");
  await expect(page.getByText(/No jobs match/)).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(rows(page)).toHaveCount(20);
  await expect(search).toHaveValue("");
});

test("search combines with status filter", async ({ page }) => {
  await page.goto("/?status=Completed&q=kevin");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Kevin Doyle");
});

test("sorts by value", async ({ page }) => {
  await page.goto("/?sort=value");
  const values = (await rows(page).locator("td:last-child").allInnerTexts()).map((v) => Number(v.replace(/[^\d.]/g, "")));
  expect(values).toEqual([...values].sort((a, b) => b - a));
});

test("adds a note that persists after reload", async ({ page }, info) => {
  await page.goto("/");
  await rows(page).first().getByRole("link").click();
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();

  const note = `Test note ${info.project.name} ${Date.now()}`;
  await page.getByLabel("Add a note").fill(note);
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.locator("ol li").first()).toContainText(note);
  await expect(page.getByLabel("Add a note")).toHaveValue("");

  await page.reload();
  await expect(page.locator("ol li").first()).toContainText(note);
});

test("rejects an empty note", async ({ page }) => {
  await page.goto("/jobs/2");
  await page.getByLabel("Add a note").fill("   ");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.locator("#note-error")).toHaveText("Write a note first.");
});

test("changes status and logs it", async ({ page }) => {
  await page.goto("/jobs/3");
  const done = page.getByRole("button", { name: "Completed", exact: true });
  const next = (await done.getAttribute("aria-pressed")) === "true" ? "In Progress" : "Completed";
  await page.getByRole("button", { name: next, exact: true }).click();
  await expect(page.locator("ol li").first()).toContainText(`→ ${next}`);
  await page.reload();
  await expect(page.getByRole("button", { name: next, exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("unknown job shows not found", async ({ page }) => {
  await page.goto("/jobs/99999");
  await expect(page.getByRole("heading", { name: "Job not found" })).toBeVisible();
});

test("flags scheduled jobs past their booked date", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status").filter({ hasText: "past the booked date" })).toBeVisible();
  await page.getByRole("link", { name: "Review overdue" }).click();
  await expect(page).toHaveURL(/status=Scheduled/);
  await expect(page.locator("tbody tr").first().getByText("Overdue").filter({ visible: true })).toBeVisible();
});

test("digest endpoint summarises the board for automations", async ({ request }) => {
  const body = await (await request.get("/api/digest")).json();
  expect(body.overdue.length).toBeGreaterThan(0);
  expect(body.text).toContain("in the pipeline");
});

test("health endpoint reports DB up", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toMatchObject({ ok: true, db: "up" });
});

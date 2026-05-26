const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HOST = "127.0.0.1";
const DESKTOP_PORT = Number(process.env.STUDIO_SHELL_DESKTOP_PORT || 5192);
const WEB_PORT = Number(process.env.STUDIO_SHELL_WEB_PORT || 3015);
const STARTUP_TIMEOUT_MS = Number(process.env.STUDIO_SHELL_STARTUP_TIMEOUT_MS || 90000);

function resolvePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE_PATH,
    path.join(os.tmpdir(), "mozen-playwright-1.56.1", "node_modules", "playwright"),
    "playwright",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next known install location.
    }
  }

  throw new Error(
    "Playwright is not available. Install it or set PLAYWRIGHT_MODULE_PATH to a local playwright module.",
  );
}

function resolveBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_BROWSER_EXECUTABLE,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function resolvePackageBin(relativePath) {
  const binPath = path.join(ROOT, "node_modules", ...relativePath.split("/"));
  if (!fs.existsSync(binPath)) {
    throw new Error(`Cannot find package bin: ${binPath}`);
  }
  return binPath;
}

function startNodeServer(label, binSpecifier, args, env = {}) {
  const child = spawn(process.execPath, [resolvePackageBin(binSpecifier), ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      ...env,
      BROWSER: "none",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));

  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;

  await new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 4000).unref();
  });
}

async function waitForHttp(url, label) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`${label} did not become ready at ${url}: ${lastError?.message || "timeout"}`);
}

function attachPageGuards(page, label) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/favicon\.ico|Failed to load resource: the server responded with a status of 404/i.test(text)) return;
    errors.push(`[${label}] console.error: ${text}`);
  });
  page.on("pageerror", (error) => {
    errors.push(`[${label}] pageerror: ${error.message}`);
  });
  return errors;
}

async function assertNoPageErrors(errors) {
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
}

async function waitForCondition(predicate, message, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function enableProviderCapabilities(page, capabilityKeys) {
  const labels = {
    agent: "\u667a\u80fd\u4f53",
    apps: "\u5e94\u7528\u4e2d\u5fc3",
    chat: "Chat",
    image: "\u56fe\u7247",
    video: "\u89c6\u9891",
    workflow: "\u5de5\u4f5c\u6d41",
  };

  for (const capabilityKey of capabilityKeys) {
    const label = labels[capabilityKey];
    if (!label) throw new Error(`Unknown capability key: ${capabilityKey}`);

    const capabilitySwitch = page.getByRole("switch", { name: new RegExp(`\\u652f\\u6301${label}`) });
    await capabilitySwitch.waitFor();
    if ((await capabilitySwitch.getAttribute("aria-checked")) !== "true") {
      await capabilitySwitch.click();
    }
  }
}

async function exerciseApiProviderManagement(page, label, reopenAfterReload = null, options = {}) {
  const providerName = `Smoke ${label} Provider`;
  const imageModel = `smoke-${label.toLowerCase()}-image`;
  const imageParityModel = "gpt-image-2-all";
  const videoModel = `smoke-${label.toLowerCase()}-video`;
  const videoParityModel = "sd-2-vip";
  const enabledCapabilities = options.enabledCapabilities || [];

  await page.getByRole("button", { name: /\u9690\u85cf\u5bc6\u94a5\u5bfc\u51fa/ }).waitFor();
  await page.getByRole("button", { name: /\u5b8c\u6574\u5bfc\u51fa/ }).waitFor();
  await page.getByRole("button", { name: /\u5bfc\u5165\u914d\u7f6e/ }).waitFor();
  await page.getByRole("button", { name: /\u65b0\u5efa\u901a\u9053/ }).click();
  await page.waitForTimeout(200);

  await page.getByRole("textbox", { name: /\u901a\u9053\u540d\u79f0/ }).fill(providerName);
  await page.getByRole("textbox", { name: /API \u5730\u5740/ }).fill("http://127.0.0.1:65530/v1");
  await page.getByRole("textbox", { name: /API Key|\u8bbf\u95ee\u53e3\u4ee4/ }).fill("sk-smoke-provider");

  const whitelistInputs = page.getByPlaceholder(/\u8f93\u5165.*\u6a21\u578b\u540d.*\u56de\u8f66\u6dfb\u52a0/);
  await whitelistInputs.nth(0).fill(imageModel);
  await whitelistInputs.nth(0).press("Enter");
  await page.getByText(imageModel).first().waitFor();
  await whitelistInputs.nth(0).fill(imageParityModel);
  await whitelistInputs.nth(0).press("Enter");
  await page.getByText(imageParityModel).first().waitFor();
  await whitelistInputs.nth(1).fill(videoModel);
  await whitelistInputs.nth(1).press("Enter");
  await page.getByText(videoModel).first().waitFor();
  await whitelistInputs.nth(1).fill(videoParityModel);
  await whitelistInputs.nth(1).press("Enter");
  await page.getByText(videoParityModel).first().waitFor();
  await enableProviderCapabilities(page, enabledCapabilities);

  await page.getByRole("button", { name: /\u4fdd\u5b58\u5e76\u4f7f\u7528/ }).click();
  await page.getByText(providerName).first().waitFor();

  await page.reload({ waitUntil: "domcontentloaded" });
  if (reopenAfterReload) await reopenAfterReload(page);
  await page.getByRole("heading", { name: /API \u7ba1\u7406/ }).waitFor();
  await page.getByText(providerName).first().waitFor();
  await page.getByText(imageModel).first().waitFor();
  await page.getByText(imageParityModel).first().waitFor();
  await page.getByText(videoModel).first().waitFor();
  await page.getByText(videoParityModel).first().waitFor();
}

async function installApiHealthMockRoutes(page) {
  await page.route("**/api/provider/v1/models", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          { id: "gpt-image-2-all" },
          { id: "gemini-3-pro-image-preview" },
          { id: "text-embedding-3-small" },
        ],
      }),
    });
  });

  await page.route("**/api/provider/v1/images/generations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ url: "data:image/png;base64,iVBORw0KGgo=" }],
      }),
    });
  });
}

async function installWorkflowMockRoutes(page) {
  const emptyWorkflowList = JSON.stringify([]);
  const routes = [
    "**/api/workflow/get-template-workflows**",
    "**/api/workflow/get-workflow-defs**",
    "**/api/workflow/get-published-workflows**",
  ];

  await Promise.all(
    routes.map((routePattern) =>
      page.route(routePattern, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: emptyWorkflowList,
        });
      }),
    ),
  );
}

async function installAgentMockRoutes(page) {
  await page.route("**/api/agents/templates/agents**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        agents: [
          {
            id: "smoke-template-agent",
            agent_id: "smoke-template-agent",
            name: "Smoke Template Agent",
            category: "Smoke",
            owner_username: "Mozen",
          },
        ],
      }),
    });
  });

  await page.route("**/api/agents/user/agents**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ agents: [] }),
    });
  });

  await page.route("**/api/agents/user/conversations**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

async function installAppsMockRoutes(page) {
  const interests = [];

  await page.route(/\/api\/app\/interests(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(interests.map((entry) => entry.app_name)),
    });
  });

  await page.route(/\/api\/app\/interest(?:\?.*)?$/, async (route) => {
    const body = route.request().postDataJSON();
    interests.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, ...body }),
    });
  });

  return interests;
}

async function assertApiHealthSurface(page) {
  await page.getByRole("heading", { name: /API \u5065\u5eb7\u68c0\u67e5/ }).waitFor();
  await page.getByRole("button", { name: /\u5237\u65b0\u6a21\u578b\u5217\u8868/ }).waitFor();
  await page.getByRole("button", { name: /\u5f00\u59cb\u4f4e\u6210\u672c\u5b9e\u6d4b/ }).waitFor();
  await page.getByText("gpt-image-2-all").first().waitFor();
}

async function assertImageStudioSurface(page, { expectedModel = null } = {}) {
  await page.getByRole("button", { name: /\u6587\u751f\u56fe/ }).waitFor();
  await page.getByRole("button", { name: /\u56fe\u751f\u56fe/ }).waitFor();
  await page.getByRole("button", { name: /\u5f00\u59cb\u751f\u6210/ }).waitFor();
  if (expectedModel) {
    await page.getByText(expectedModel).first().waitFor();
  }
}

async function assertVideoStudioSurface(page, { expectedModel = null } = {}) {
  await page.getByRole("button", { name: /\u6587\u751f\u89c6\u9891/ }).waitFor();
  await page.getByRole("button", { name: /\u5355\u56fe\u751f\u89c6\u9891/ }).waitFor();
  await page.getByRole("button", { name: /\u9996\u5c3e\u5e27/ }).waitFor();
  await page.getByRole("button", { name: /\u5f00\u59cb\u751f\u6210/ }).waitFor();
  if (expectedModel) {
    await page.getByText(expectedModel).first().waitFor();
  }
}

async function assertMarketingStudioSurface(page) {
  await page.getByText(/\u6682\u65e0\u8425\u9500\u89c6\u9891/).waitFor();
  await page.getByPlaceholder(/\u5199\u8425\u9500\u89c6\u9891\u52a8\u4f5c/).waitFor();
  await page.getByRole("button", { name: /\u5f00\u59cb\u751f\u6210/ }).waitFor();
  await page.getByText("Seedance 2.0").first().waitFor();
}

async function assertWorkflowStudioSurface(page) {
  await page.getByRole("heading", { name: /\u5de5\u4f5c\u6d41/ }).waitFor();
  await page.getByRole("button", { name: /\u6a21\u677f/ }).waitFor();
  await page.getByRole("button", { name: /\u6211\u7684\u5de5\u4f5c\u6d41/ }).waitFor();
  await page.getByRole("button", { name: /\u793e\u533a/ }).waitFor();
  await page.getByText(/\u672a\u6807\u8bb0\u652f\u6301\u5de5\u4f5c\u6d41/).first().waitFor();
}

async function assertAgentStudioSurface(page) {
  await page.getByRole("heading", { name: /\u667a\u80fd\u4f53/ }).waitFor();
  await page.getByRole("button", { name: /\u6a21\u677f/ }).waitFor();
  await page.getByRole("button", { name: /\u6211\u7684\u667a\u80fd\u4f53/ }).waitFor();
  await page.getByRole("button", { name: /\u6211\u7684\u5bf9\u8bdd/ }).waitFor();
  await page.getByRole("button", { name: /^\+\s*\u5f00\u53d1\u4e2d$/ }).waitFor();
  await page.getByText("Smoke Template Agent").first().waitFor();

  await page.getByRole("button", { name: /\u6211\u7684\u667a\u80fd\u4f53/ }).click();
  await page.getByText(/\u6682\u65e0\u667a\u80fd\u4f53/).first().waitFor();

  await page.getByRole("button", { name: /\u6211\u7684\u5bf9\u8bdd/ }).click();
  await page.getByText(/\u6682\u65e0\u5bf9\u8bdd/).first().waitFor();
}

async function assertAppsStudioSurface(page, interests) {
  await page.getByText(/\u53ef\u53d8\u73b0\u6a21\u677f/).waitFor();
  await page.getByText(/\u4e0a\u7ebf\u4f60\u7684 AI \u5e94\u7528/).waitFor();
  await page.getByText("AI \u5934\u50cf\u5de5\u4f5c\u5ba4").first().waitFor();
  await page.getByText("Pet Product Studio").first().scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "GitHub" }).first().click();
  await page.getByRole("heading", { name: "\u90e8\u7f72 Pet Product Studio" }).waitFor();
  const requestTemplateButton = page.getByRole("button", { name: /\u83b7\u53d6\u6a21\u677f/ });
  await requestTemplateButton.waitFor({ state: "visible" });
  await requestTemplateButton.evaluate((button) => {
    if (button.disabled) {
      throw new Error("Expected Apps template request button to be enabled.");
    }
    button.click();
  });
  await page.getByText(/\u6536\u5230/).waitFor();
  await waitForCondition(
    () => interests.some((entry) => entry?.app_name === "Pet Product Studio"),
    "Expected app interest registration request for Pet Product Studio.",
  );
}

async function assertCodexLabHiddenOnDesktop(page) {
  const codexLabMatches = await page.getByText(/Codex Lab|Codex \u591a\u6a21\u6001\u5b9e\u9a8c\u53f0/).count();
  if (codexLabMatches !== 0) {
    throw new Error("Codex Lab is expected to remain Web-only and hidden from the desktop shell.");
  }
}

async function assertCodexLabWebRoute(page) {
  await page.goto(`http://${HOST}:${WEB_PORT}/codex-lab`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Codex \u591a\u6a21\u6001\u5b9e\u9a8c\u53f0/ }).waitFor();
  await page.getByRole("heading", { name: /\u4efb\u52a1\u5355/ }).waitFor();
  await page.getByRole("heading", { name: /\u529f\u80fd\u6d4b\u8bd5\u77e9\u9635/ }).waitFor();
  await page.getByRole("heading", { name: /\u9879\u76ee\u8d44\u4ea7\u843d\u70b9/ }).waitFor();
}

async function runDesktopSmoke(browser) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = attachPageGuards(page, "desktop");

  await page.goto(`http://${HOST}:${DESKTOP_PORT}/`, { waitUntil: "domcontentloaded" });
  await page.getByText("MozenAIGC Desktop").waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: /^Image\b/ }).click();
  await assertImageStudioSurface(page);

  await page.getByRole("button", { name: "Tasks" }).click();
  await page.getByRole("heading", { name: /\u4efb\u52a1\u4e2d\u5fc3/ }).waitFor();
  await page.getByTitle(/\u5173\u95ed\u4efb\u52a1\u4e2d\u5fc3/).click();

  await page.getByRole("button", { name: /API Providers/ }).click();
  await page.getByRole("heading", { name: /API \u7ba1\u7406/ }).waitFor();
  await exerciseApiProviderManagement(page, "Desktop", null, { enabledCapabilities: ["agent", "apps"] });
  await page.getByRole("button", { name: /^Video\b/ }).click();
  await assertVideoStudioSurface(page, { expectedModel: "Seedance 2.0" });
  await page.getByRole("button", { name: /^Marketing\b/ }).click();
  await assertMarketingStudioSurface(page);
  await installWorkflowMockRoutes(page);
  await page.getByRole("button", { name: /^Workflows\b/ }).click();
  await assertWorkflowStudioSurface(page);
  await installAgentMockRoutes(page);
  await page.getByRole("button", { name: /^Agents\b/ }).click();
  await assertAgentStudioSurface(page);
  const desktopAppInterests = await installAppsMockRoutes(page);
  await page.getByRole("button", { name: /^Apps\b/ }).click();
  await assertAppsStudioSurface(page, desktopAppInterests);
  await page.getByRole("button", { name: /Local Models/ }).click();
  await page.getByRole("heading", { name: /\u672c\u5730\u6a21\u578b/ }).waitFor();
  await installApiHealthMockRoutes(page);
  await page.getByRole("button", { name: /API Health/ }).click();
  await assertApiHealthSurface(page);
  await page.getByRole("button", { name: /^Image\b/ }).click();
  await assertImageStudioSurface(page, { expectedModel: "GPT Image 2 All" });
  const legacyActions = await page.getByRole("button", { name: "Legacy" }).count();
  if (legacyActions !== 0) {
    throw new Error("Legacy renderer action should not be visible after DSK-70 cleanup.");
  }
  await assertCodexLabHiddenOnDesktop(page);

  await assertNoPageErrors(errors);
  await page.close();
}

async function runWebSmoke(browser) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = attachPageGuards(page, "web");

  await page.addInitScript(() => {
    window.localStorage.setItem("mozen_team_access_v1", "granted");
    window.localStorage.setItem("provider_require_key", "false");
  });

  await page.goto(`http://${HOST}:${WEB_PORT}/studio/video`, { waitUntil: "domcontentloaded" });
  await page.getByText("MozenAIGC").first().waitFor({ timeout: 30000 });
  await assertVideoStudioSurface(page);

  await page.getByRole("button", { name: /\u4efb\u52a1\u4e2d\u5fc3/ }).click();
  await page.getByRole("heading", { name: /\u4efb\u52a1\u4e2d\u5fc3/ }).waitFor();
  await page.getByTitle(/\u5173\u95ed\u4efb\u52a1\u4e2d\u5fc3/).click();

  await page.goto(`http://${HOST}:${WEB_PORT}/studio/api-providers`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /API \u7ba1\u7406/ }).waitFor();
  await page.waitForTimeout(1000);
  await exerciseApiProviderManagement(page, "Web", null, { enabledCapabilities: ["agent", "apps"] });
  await installApiHealthMockRoutes(page);
  await installWorkflowMockRoutes(page);
  await installAgentMockRoutes(page);
  const webAppInterests = await installAppsMockRoutes(page);
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/video`, { waitUntil: "domcontentloaded" });
  await assertVideoStudioSurface(page, { expectedModel: "Seedance 2.0" });
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/marketing`, { waitUntil: "domcontentloaded" });
  await assertMarketingStudioSurface(page);
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/workflows`, { waitUntil: "domcontentloaded" });
  await assertWorkflowStudioSurface(page);
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/agents`, { waitUntil: "domcontentloaded" });
  await assertAgentStudioSurface(page);
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/apps`, { waitUntil: "domcontentloaded" });
  await assertAppsStudioSurface(page, webAppInterests);
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/api-health`, { waitUntil: "domcontentloaded" });
  await assertApiHealthSurface(page);
  await page.goto(`http://${HOST}:${WEB_PORT}/studio/image`, { waitUntil: "domcontentloaded" });
  await assertImageStudioSurface(page, { expectedModel: "GPT Image 2 All" });
  await assertCodexLabWebRoute(page);

  await assertNoPageErrors(errors);
  await page.close();
}

async function main() {
  const { chromium } = resolvePlaywright();
  const desktop = startNodeServer("desktop-vite", "vite/bin/vite.js", [
    "--host",
    HOST,
    "--port",
    String(DESKTOP_PORT),
    "--strictPort",
  ]);
  const web = startNodeServer("web-next", "next/dist/bin/next", [
    "dev",
    "-H",
    HOST,
    "-p",
    String(WEB_PORT),
  ]);

  let browser = null;
  try {
    await waitForHttp(`http://${HOST}:${DESKTOP_PORT}/`, "Desktop Vite");
    await waitForHttp(`http://${HOST}:${WEB_PORT}/studio/video`, "Next Web");

    const executablePath = resolveBrowserExecutable();
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });

    await runDesktopSmoke(browser);
    await runWebSmoke(browser);

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: [
            "desktop shared shell renders",
            "desktop task center opens",
            "desktop API provider tab opens and persists custom provider",
            "desktop video studio surface renders with provider video whitelist",
            "desktop marketing studio surface renders",
            "desktop workflow studio surface renders with provider limitation",
            "desktop agent studio surface renders with mocked listings and conversations",
            "desktop apps studio surface renders and records mocked interest",
            "desktop local model manager opens",
            "desktop API health tab opens with mocked model discovery",
            "desktop image studio surface renders",
            "desktop legacy fallback action is removed",
            "desktop Codex Lab remains explicitly hidden",
            "web studio shell renders",
            "web task center opens",
            "web API provider route opens and persists custom provider",
            "web video studio route renders with provider video whitelist",
            "web marketing studio route renders",
            "web workflow studio route renders with provider limitation",
            "web agent studio route renders with mocked listings and conversations",
            "web apps studio route renders and records mocked interest",
            "web API health route opens with mocked model discovery",
            "web image studio route renders",
            "web Codex Lab route renders",
          ],
          desktopUrl: `http://${HOST}:${DESKTOP_PORT}/`,
          webUrl: `http://${HOST}:${WEB_PORT}/studio/video`,
        },
        null,
        2,
      ),
    );
  } finally {
    if (browser) await browser.close();
    await Promise.all([stopServer(desktop), stopServer(web)]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

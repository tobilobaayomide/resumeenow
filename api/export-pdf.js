import fs from "node:fs";

export const config = {
  maxDuration: 60,
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let supabaseAuthClientPromise = null;

const sanitizeFileName = (value) =>
  String(value || "Resume")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "") || "Resume";

const encodeExportPayload = (payload) =>
  Buffer.from(JSON.stringify(payload), "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getOrigin = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const host = req.headers.host;
  if (!host) {
    throw new Error("Missing host header.");
  }

  const protocol =
    typeof forwardedProto === "string" && forwardedProto.length > 0
      ? forwardedProto
      : /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)
        ? "http"
        : "https";

  return `${protocol}://${host}`;
};

const isLocalHost = (host) => /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);

const getLocalChromeExecutablePath = () => {
  const envPath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    process.env.CHROME_EXECUTABLE_PATH;

  const candidates = [
    envPath,
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : null,
    process.platform === "darwin"
      ? "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
      : null,
    process.platform === "linux" ? "/usr/bin/google-chrome-stable" : null,
    process.platform === "linux" ? "/usr/bin/google-chrome" : null,
    process.platform === "linux" ? "/usr/bin/chromium-browser" : null,
    process.platform === "linux" ? "/usr/bin/chromium" : null,
    process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : null,
    process.platform === "win32"
      ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      : null,
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

const loadBrowserRuntimes = async (req) => {
  const host = req.headers.host ?? "";

  if (isLocalHost(host)) {
    const { chromium: playwright } = await import("playwright-core");
    const executablePath = getLocalChromeExecutablePath();

    if (!executablePath) {
      throw new Error(
        "Local Chrome executable not found. Install Chrome or set CHROME_EXECUTABLE_PATH.",
      );
    }

    return {
      playwright,
      launchOptions: {
        executablePath,
        headless: true,
      },
    };
  }

  process.env.AWS_LAMBDA_JS_RUNTIME ??= "nodejs22.x";

  const chromium = (await import("@sparticuz/chromium")).default;
  const { chromium: playwright } = await import("playwright-core");

  return {
    playwright,
    launchOptions: {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    },
  };
};

const parseBody = (req) => {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  return req.body ?? {};
};

const getSupabaseServerConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new HttpError(
      500,
      "Server authentication is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
};

const getSupabaseAuthClient = async () => {
  if (!supabaseAuthClientPromise) {
    supabaseAuthClientPromise = (async () => {
      const { url, anonKey } = getSupabaseServerConfig();
      const { createClient } = await import("@supabase/supabase-js");

      return createClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
  }

  return supabaseAuthClientPromise;
};

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) return null;

  const authorization = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const [scheme, token] = String(authorization).trim().split(/\s+/, 2);

  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token;
};

const authenticateRequest = async (req) => {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    throw new HttpError(401, "Authentication required. Please sign in again.");
  }

  const supabase = await getSupabaseAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new HttpError(401, "Invalid or expired session. Please sign in again.");
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  let browser;

  try {
    await authenticateRequest(req);

    const { data, templateId, fileName } = parseBody(req);
    if (!data || !templateId) {
      res.status(400).send("Missing export payload.");
      return;
    }

    const payload = encodeExportPayload({ data, templateId, fileName });
    const origin = getOrigin(req);
    const exportUrl = `${origin}/print/resume#${payload}`;

    const { playwright, launchOptions } = await loadBrowserRuntimes(req);
    browser = await playwright.launch(launchOptions);

    const page = await browser.newPage({
      viewport: {
        width: 1100,
        height: 1500,
      },
      deviceScaleFactor: 1,
    });

    await page.emulateMedia({ media: "screen" });
    await page.goto(exportUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => window.__RESUME_PRINT_READY__ === true, {
      timeout: 20000,
    });
    await page.evaluate((title) => {
      if (typeof title === "string" && title.trim()) {
        document.title = title.trim();
      }
    }, fileName);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      preferCSSPageSize: false,
    });

    const finalFileName = `${sanitizeFileName(fileName)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${finalFileName}"`,
    );
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("PDF export failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to export PDF.";

    res
      .status(error instanceof HttpError ? error.status : 500)
      .send(
        process.env.NODE_ENV === "production"
          ? error instanceof HttpError
            ? message
            : "Failed to export PDF."
          : `Failed to export PDF: ${message}`,
      );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

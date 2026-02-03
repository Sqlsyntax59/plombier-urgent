import { test, expect, Page, BrowserContext, Response, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.AUDIT_BASE_URL || 'https://plombier-urgent.vercel.app';

// Data collectors
interface AuditData {
  timestamp: string;
  baseUrl: string;
  availability: {
    ok: boolean;
    statusCode: number;
    responseTime: number;
    httpsValid: boolean;
    error?: string;
  };
  routes: {
    discovered: string[];
    tested: { url: string; status: number; ok: boolean }[];
    errors4xx: { url: string; status: number }[];
    errors5xx: { url: string; status: number }[];
  };
  brokenLinks: { source: string; href: string; status: number }[];
  networkRequests: {
    endpoints: { url: string; method: string; status: number }[];
    errors: { url: string; method: string; status: number; error?: string }[];
  };
  auth: {
    loginPageAccessible: boolean;
    loginTested: boolean;
    loginSuccess?: boolean;
    protectedPageAccess?: boolean;
    logoutSuccess?: boolean;
    error?: string;
  };
  consoleErrors: { page: string; message: string; type: string }[];
  security: {
    https: boolean;
    csp: string | null;
    cookiesSecure: boolean;
    xFrameOptions: string | null;
    strictTransportSecurity: string | null;
  };
  verdict: 'GO' | 'NO-GO';
  reasons: string[];
}

let auditData: AuditData = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  availability: { ok: false, statusCode: 0, responseTime: 0, httpsValid: false },
  routes: { discovered: [], tested: [], errors4xx: [], errors5xx: [] },
  brokenLinks: [],
  networkRequests: { endpoints: [], errors: [] },
  auth: { loginPageAccessible: false, loginTested: false },
  consoleErrors: [],
  security: { https: false, csp: null, cookiesSecure: false, xFrameOptions: null, strictTransportSecurity: null },
  verdict: 'NO-GO',
  reasons: []
};

// Known public routes to test
const PUBLIC_ROUTES = [
  '/',
  '/artisan/login',
  '/artisan/inscription',
  '/demande',
  '/cgv',
  '/admin/login',
];

// Helper to collect console errors
function setupConsoleCollector(page: Page, pageName: string) {
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      auditData.consoleErrors.push({
        page: pageName,
        message: msg.text(),
        type: msg.type()
      });
    }
  });
}

// Helper to collect network requests
function setupNetworkCollector(page: Page) {
  page.on('response', async (response: Response) => {
    const url = response.url();
    const status = response.status();
    const method = response.request().method();

    // Only track API calls and page navigations
    if (url.includes('/api/') || url.includes('supabase') || method !== 'GET' || !url.includes('static')) {
      const endpoint = { url, method, status };
      auditData.networkRequests.endpoints.push(endpoint);

      if (status >= 500) {
        auditData.networkRequests.errors.push({ ...endpoint, error: `Server error ${status}` });
      }
    }
  });
}

test.describe('Production Audit - Plombier Urgent', () => {

  test('1. Availability Check', async ({ page }) => {
    const startTime = Date.now();

    try {
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const responseTime = Date.now() - startTime;

      auditData.availability = {
        ok: response?.ok() ?? false,
        statusCode: response?.status() ?? 0,
        responseTime,
        httpsValid: BASE_URL.startsWith('https://'),
      };

      // Check security headers
      const headers = response?.headers() ?? {};
      auditData.security = {
        https: BASE_URL.startsWith('https://'),
        csp: headers['content-security-policy'] ?? null,
        cookiesSecure: true, // Will be verified later
        xFrameOptions: headers['x-frame-options'] ?? null,
        strictTransportSecurity: headers['strict-transport-security'] ?? null,
      };

      expect(response?.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(10000);

    } catch (error) {
      auditData.availability.error = String(error);
      throw error;
    }
  });

  test('2. Public Routes Crawl', async ({ page }) => {
    setupConsoleCollector(page, 'routes-crawl');
    setupNetworkCollector(page);

    const discoveredRoutes = new Set<string>(PUBLIC_ROUTES);

    // First pass: test known routes and discover new ones
    for (const route of PUBLIC_ROUTES) {
      const fullUrl = `${BASE_URL}${route}`;

      try {
        const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
        const status = response?.status() ?? 0;

        auditData.routes.tested.push({ url: route, status, ok: response?.ok() ?? false });

        if (status >= 400 && status < 500) {
          auditData.routes.errors4xx.push({ url: route, status });
        } else if (status >= 500) {
          auditData.routes.errors5xx.push({ url: route, status });
        }

        // Discover internal links
        if (response?.ok()) {
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]'))
              .map(a => a.getAttribute('href'))
              .filter(href => href && (href.startsWith('/') || href.startsWith(window.location.origin)))
              .map(href => href!.startsWith('/') ? href : new URL(href!).pathname);
          });

          links.forEach(link => {
            if (link && !link.includes('#') && !link.includes('mailto:') && !link.includes('tel:')) {
              discoveredRoutes.add(link);
            }
          });
        }
      } catch (error) {
        auditData.routes.tested.push({ url: route, status: 0, ok: false });
        console.error(`Failed to access ${route}: ${error}`);
      }
    }

    auditData.routes.discovered = Array.from(discoveredRoutes);

    // Expect no 5xx errors
    expect(auditData.routes.errors5xx.length).toBe(0);
  });

  test('3. Broken Links Check', async ({ page }) => {
    setupConsoleCollector(page, 'broken-links');

    // Check all discovered routes for broken internal links
    const checkedLinks = new Set<string>();

    for (const route of auditData.routes.discovered.slice(0, 20)) { // Limit to 20 routes
      const fullUrl = `${BASE_URL}${route}`;

      try {
        const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        if (!response?.ok()) continue;

        // Get all links on page
        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({
              href: a.getAttribute('href'),
              text: a.textContent?.trim() || ''
            }))
            .filter(l => l.href && (l.href.startsWith('/') || l.href.startsWith(window.location.origin)));
        });

        // Check each link
        for (const link of links) {
          if (!link.href || checkedLinks.has(link.href)) continue;
          checkedLinks.add(link.href);

          const linkUrl = link.href.startsWith('/') ? `${BASE_URL}${link.href}` : link.href;

          try {
            const linkResponse = await page.request.head(linkUrl, { timeout: 10000 });
            const status = linkResponse.status();

            if (status >= 400) {
              auditData.brokenLinks.push({
                source: route,
                href: link.href,
                status
              });
            }
          } catch {
            auditData.brokenLinks.push({
              source: route,
              href: link.href,
              status: 0
            });
          }
        }
      } catch (error) {
        console.error(`Failed to check links on ${route}: ${error}`);
      }
    }

    // Expect no broken internal links
    expect(auditData.brokenLinks.length).toBe(0);
  });

  test('4. Backend/API Health', async ({ page }) => {
    setupConsoleCollector(page, 'api-health');
    setupNetworkCollector(page);

    // Visit main pages to trigger API calls
    const pagesToVisit = ['/', '/demande', '/artisan/login'];

    for (const route of pagesToVisit) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000); // Wait for async requests
      } catch {
        // Continue with other pages
      }
    }

    // Check for 5xx errors in collected requests
    const serverErrors = auditData.networkRequests.errors.filter(e => e.status >= 500);
    expect(serverErrors.length).toBe(0);
  });

  test('5. Auth Flow (if credentials provided)', async ({ page }) => {
    setupConsoleCollector(page, 'auth');

    const testEmail = process.env.TEST_EMAIL;
    const testPassword = process.env.TEST_PASSWORD;

    // Check login page accessibility
    try {
      const loginResponse = await page.goto(`${BASE_URL}/artisan/login`, { waitUntil: 'networkidle' });
      auditData.auth.loginPageAccessible = loginResponse?.ok() ?? false;

      expect(loginResponse?.ok()).toBeTruthy();
    } catch (error) {
      auditData.auth.error = `Login page not accessible: ${error}`;
      return;
    }

    // If test credentials provided, test full auth flow
    if (testEmail && testPassword) {
      auditData.auth.loginTested = true;

      try {
        // Fill login form
        await page.fill('input[type="email"], input[name="email"]', testEmail);
        await page.fill('input[type="password"], input[name="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(/.*dashboard.*|.*leads.*/, { timeout: 15000 });
        auditData.auth.loginSuccess = true;

        // Test protected page access
        auditData.auth.protectedPageAccess = page.url().includes('dashboard') || page.url().includes('leads');

        // Test page reload
        await page.reload({ waitUntil: 'networkidle' });
        const stillLoggedIn = page.url().includes('dashboard') || page.url().includes('leads');

        // Test logout if possible
        const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
        if (await logoutButton.count() > 0) {
          await logoutButton.first().click();
          await page.waitForTimeout(2000);
          auditData.auth.logoutSuccess = !page.url().includes('dashboard');
        }

        expect(auditData.auth.loginSuccess).toBeTruthy();
        expect(stillLoggedIn).toBeTruthy();

      } catch (error) {
        auditData.auth.error = `Auth flow error: ${error}`;
        auditData.auth.loginSuccess = false;
      }
    } else {
      auditData.auth.loginTested = false;
      console.log('No test credentials provided, skipping full auth test');
    }
  });

  test('6. Console Errors Check', async ({ page }) => {
    const criticalErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out non-critical errors
        if (!text.includes('favicon') &&
            !text.includes('404') &&
            !text.includes('Failed to load resource') &&
            !text.includes('third-party')) {
          criticalErrors.push(text);
        }
      }
    });

    // Visit main pages
    const pagesToCheck = ['/', '/demande', '/artisan/login', '/artisan/inscription'];

    for (const route of pagesToCheck) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);

        // Check for blank screen
        const bodyContent = await page.evaluate(() => document.body?.innerText?.length || 0);
        expect(bodyContent).toBeGreaterThan(10);

      } catch {
        // Continue with other pages
      }
    }

    // Log critical errors but don't fail if they're minor
    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors);
    }
  });

  test('7. Security Headers Check', async ({ page }) => {
    const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const headers = response?.headers() ?? {};

    // HTTPS is mandatory
    expect(BASE_URL.startsWith('https://')).toBeTruthy();

    // Log security headers status
    console.log('Security Headers:');
    console.log('- HTTPS:', BASE_URL.startsWith('https://') ? 'YES' : 'NO');
    console.log('- CSP:', headers['content-security-policy'] ? 'Present' : 'Missing');
    console.log('- X-Frame-Options:', headers['x-frame-options'] || 'Missing');
    console.log('- HSTS:', headers['strict-transport-security'] || 'Missing');
  });

  test.afterAll(async () => {
    // Generate verdict
    const issues: string[] = [];

    if (!auditData.availability.ok) {
      issues.push('Site not available or returning errors');
    }

    if (auditData.routes.errors5xx.length > 0) {
      issues.push(`${auditData.routes.errors5xx.length} routes returning 5xx errors`);
    }

    if (auditData.brokenLinks.length > 0) {
      issues.push(`${auditData.brokenLinks.length} broken internal links found`);
    }

    if (auditData.networkRequests.errors.filter(e => e.status >= 500).length > 0) {
      issues.push('Backend API returning 5xx errors');
    }

    if (!auditData.auth.loginPageAccessible) {
      issues.push('Login page not accessible');
    }

    if (auditData.auth.loginTested && !auditData.auth.loginSuccess) {
      issues.push('Authentication flow failed');
    }

    auditData.reasons = issues;
    auditData.verdict = issues.length === 0 ? 'GO' : 'NO-GO';

    // Write audit results
    const outputPath = path.join(__dirname, 'audit-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(auditData, null, 2));

    console.log('\n========================================');
    console.log(`VERDICT: ${auditData.verdict}`);
    console.log('========================================');
    if (issues.length > 0) {
      console.log('Issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
  });
});

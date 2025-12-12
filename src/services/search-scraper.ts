import puppeteer, { Browser, Page } from "puppeteer";

export interface SearchArticle {
  id: string;
  title: string;
  price: string;
  priceType: string;
  location: string;
  date: string;
  url: string;
  images: string[];
  thumbnailUrl: string;
  description?: string;
  seller:
    | {
        name: string;
        type: string;
      }
    | undefined;
}

export interface SearchResult {
  success: boolean;
  query: string;
  totalAvailable: number;
  totalPages: number;
  pagesScraped: number;
  articlesScraped: number;
  articles: SearchArticle[];
  searchUrl: string;
  scrapedAt: string;
  error?: string;
}

export interface SearchOptions {
  query: string;
  count?: number | undefined;
  scrapeAll?: boolean | undefined;
  location?: string | undefined;
  radius?: number | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sortBy?: "SORTING_DATE" | "PRICE_AMOUNT" | "RELEVANCE" | undefined;
  includeDetails?: boolean | undefined;
}

export class SearchScraper {
  private browser: Browser | null = null;
  private readonly debugPort: number;

  constructor(debugPort: number = 9222) {
    this.debugPort = debugPort;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async connectToBrowser(): Promise<Browser> {
    try {
      // Try to connect to existing Chrome instance
      const response = await fetch(
        `http://localhost:${this.debugPort}/json/version`
      );
      const data = await response.json();

      if (data.webSocketDebuggerUrl) {
        console.log("🔗 Connecting to existing Chrome instance...");
        return await puppeteer.connect({
          browserWSEndpoint: data.webSocketDebuggerUrl,
        });
      }

      throw new Error("No WebSocket URL found");
    } catch (error) {
      console.log("⚠️ Could not connect to existing Chrome, launching new...");
      return await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }
  }

  private buildSearchUrl(options: SearchOptions, page: number = 1): string {
    // Kleinanzeigen URL structure:
    // Seite 1: https://www.kleinanzeigen.de/s-{query}/k0
    // Seite 2: https://www.kleinanzeigen.de/s-seite:2/{query}/k0
    // Mit Preis: https://www.kleinanzeigen.de/s-preis:{min}:{max}/{query}/k0

    const baseUrl = "https://www.kleinanzeigen.de";

    // Query: replace spaces with hyphens, keep simple
    const query = options.query.toLowerCase().replace(/\s+/g, "-");

    // Build path parts (before query)
    const pathParts: string[] = [];

    // Add page if > 1
    if (page > 1) {
      pathParts.push(`seite:${page}`);
    }

    // Add price range if specified
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      const min = options.minPrice ?? "";
      const max = options.maxPrice ?? "";
      pathParts.push(`preis:${min}:${max}`);
    }

    // Build the full path
    let path: string;
    if (pathParts.length > 0) {
      // Format: /s-seite:2/query/k0 or /s-seite:2/preis:100:500/query/k0
      path = `/s-${pathParts.join("/")}/${query}/k0`;
    } else {
      // Format: /s-query/k0
      path = `/s-${query}/k0`;
    }

    // Build query params for location, radius, sorting
    const params = new URLSearchParams();

    if (options.location) {
      params.set("locationStr", options.location);
    }

    if (options.radius) {
      params.set("radius", options.radius.toString());
    }

    if (options.sortBy) {
      params.set("sortingField", options.sortBy);
    }

    const queryString = params.toString();
    const finalUrl = queryString
      ? `${baseUrl}${path}?${queryString}`
      : `${baseUrl}${path}`;

    console.log(`  🔗 Built URL for page ${page}: ${finalUrl}`);
    return finalUrl;
  }

  private async getTotalResults(
    page: Page
  ): Promise<{ totalArticles: number; totalPages: number }> {
    try {
      const result = await page.evaluate(() => {
        // Strategy 1: Look for pagination info like "Seite 1 von 50"
        const paginationEl = document.querySelector(
          '.pagination-current, [class*="pagination"]'
        );
        const paginationText = paginationEl?.textContent || "";
        const pageMatch = paginationText.match(/von\s+(\d+)/i);
        if (pageMatch && pageMatch[1]) {
          const totalPages = parseInt(pageMatch[1]) || 1;
          return { totalArticles: totalPages * 25, totalPages };
        }

        // Strategy 2: Count pagination links to find max page
        const paginationLinks = document.querySelectorAll(
          '.pagination-page, a[class*="pagination"]'
        );
        let maxPage = 1;
        paginationLinks.forEach((link) => {
          const pageNum = parseInt(link.textContent || "0");
          if (!isNaN(pageNum) && pageNum > maxPage) {
            maxPage = pageNum;
          }
        });
        if (maxPage > 1) {
          return { totalArticles: maxPage * 25, totalPages: maxPage };
        }

        // Strategy 3: Look for result count text like "1 - 25 von 12.345"
        const resultElements = Array.from(
          document.querySelectorAll(
            '.resultlist-headline-count, .srp-headline, h1, [class*="result"], [class*="count"]'
          )
        );
        for (const el of resultElements) {
          const text = el.textContent || "";
          // Match patterns like "12.345 Ergebnisse" or "1 - 25 von 12.345"
          const vonMatch = text.match(/von\s+([\d\.]+)/i);
          if (vonMatch && vonMatch[1]) {
            const total = parseInt(vonMatch[1].replace(/\./g, "")) || 0;
            if (total > 0) {
              return {
                totalArticles: total,
                totalPages: Math.ceil(total / 25),
              };
            }
          }
          // Match "12.345 Anzeigen" or "12.345 Ergebnisse"
          const countMatch = text.match(
            /([\d\.]+)\s*(Anzeige|Ergebnis|Treffer)/i
          );
          if (countMatch && countMatch[1]) {
            const total = parseInt(countMatch[1].replace(/\./g, "")) || 0;
            if (total > 0) {
              return {
                totalArticles: total,
                totalPages: Math.ceil(total / 25),
              };
            }
          }
        }

        // Strategy 4: Fallback - count visible articles and assume more pages exist
        const articles = document.querySelectorAll(
          "article[data-adid], li.ad-listitem article, .aditem"
        );
        const hasNextPage = document.querySelector(
          'a[class*="pagination-next"], a[title*="nächste"], .pagination-page'
        );
        if (articles.length >= 25 && hasNextPage) {
          // Assume at least 10 pages if we can't determine
          return { totalArticles: 250, totalPages: 10 };
        }

        return { totalArticles: articles.length, totalPages: 1 };
      });

      console.log(
        `  📊 Detected: ${result.totalArticles} articles across ${result.totalPages} pages`
      );
      return result;
    } catch (error) {
      console.error("Could not get total results:", error);
      return { totalArticles: 0, totalPages: 1 };
    }
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const requestedCount = options.count || 10;
    const scrapeAll = options.scrapeAll || false;
    const searchUrl = this.buildSearchUrl(options);
    const articlesPerPage = 25;

    console.log(`🔍 Searching Kleinanzeigen for: "${options.query}"`);
    console.log(`📊 Requested articles: ${scrapeAll ? "ALL" : requestedCount}`);
    console.log(`🌐 Search URL: ${searchUrl}`);

    let page: Page | null = null;
    const allArticles: SearchArticle[] = [];
    let totalAvailable = 0;
    let totalPages = 1;
    let pagesScraped = 0;

    try {
      this.browser = await this.connectToBrowser();
      page = await this.browser.newPage();

      // Set a reasonable viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Navigate to first search page
      console.log("🌐 Navigating to Kleinanzeigen...");
      await page.goto(searchUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Handle cookie consent if it appears
      await this.handleCookieConsent(page);

      // Wait for results to load
      await page
        .waitForSelector(
          "article[data-adid], ul.aditem-list li.ad-listitem, .aditem",
          { timeout: 10000 }
        )
        .catch(() => {
          console.log("⚠️ No results found or page structure changed");
        });

      // Get total results and pages
      const totals = await this.getTotalResults(page);
      totalAvailable = totals.totalArticles;
      totalPages = totals.totalPages;

      console.log(
        `📈 Total available: ${totalAvailable} articles across ${totalPages} pages`
      );

      // Calculate how many articles to scrape
      const targetCount = scrapeAll ? totalAvailable : requestedCount;
      const pagesToScrape = scrapeAll
        ? totalPages
        : Math.ceil(Math.min(targetCount, totalAvailable) / articlesPerPage);

      console.log(
        `🎯 Will scrape up to ${targetCount} articles from ${pagesToScrape} pages`
      );

      // Scrape pages
      for (let currentPage = 1; currentPage <= pagesToScrape; currentPage++) {
        try {
          // Navigate to page if not the first one
          if (currentPage > 1) {
            const pageUrl = this.buildSearchUrl(options, currentPage);
            console.log(`📄 Navigating to page ${currentPage}...`);
            await page.goto(pageUrl, {
              waitUntil: "domcontentloaded", // Faster than networkidle2
              timeout: 60000, // 60 seconds timeout
            });
            await this.wait(2000); // Wait for content to load
          }

          // How many more articles do we need?
          const remaining = targetCount - allArticles.length;
          const toScrapeThisPage = Math.min(remaining, articlesPerPage);

          // Scrape articles from current page
          const pageArticles = await this.scrapeArticlesFromPage(
            page,
            toScrapeThisPage,
            options.includeDetails || false,
            currentPage
          );

          allArticles.push(...pageArticles);
          pagesScraped++;

          console.log(
            `  ✅ Page ${currentPage}: Scraped ${pageArticles.length} articles (Total: ${allArticles.length})`
          );

          // Stop if we have enough articles or no more articles found
          if (allArticles.length >= targetCount || pageArticles.length === 0) {
            break;
          }
        } catch (pageError) {
          console.error(
            `  ⚠️ Error on page ${currentPage}:`,
            pageError instanceof Error ? pageError.message : pageError
          );
          console.log(
            `  ℹ️ Continuing with ${allArticles.length} articles scraped so far`
          );
          break; // Stop pagination on error, return what we have
        }
      }

      console.log(
        `✅ Successfully scraped ${allArticles.length} articles from ${pagesScraped} pages`
      );

      // Close the page (but keep browser connection)
      await page.close();

      return {
        success: true,
        query: options.query,
        totalAvailable,
        totalPages,
        pagesScraped,
        articlesScraped: allArticles.length,
        articles: allArticles,
        searchUrl,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Search failed:", error);

      if (page) {
        await page.close().catch(() => {});
      }

      return {
        success: false,
        query: options.query,
        totalAvailable,
        totalPages,
        pagesScraped,
        articlesScraped: allArticles.length,
        articles: allArticles,
        searchUrl,
        scrapedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async handleCookieConsent(page: Page): Promise<void> {
    try {
      // Try to click accept button on cookie banner
      const acceptButton = await page.$(
        '#gdpr-banner-accept, [data-testid="gdpr-banner-accept"], button[id*="accept"], .gdpr-banner-accept'
      );
      if (acceptButton) {
        console.log("🍪 Accepting cookies...");
        await acceptButton.click();
        await this.wait(1000);
      }
    } catch (error) {
      // Cookie banner may not exist, continue
    }
  }

  private async scrapeArticlesFromPage(
    page: Page,
    count: number,
    includeDetails: boolean,
    pageNum: number
  ): Promise<SearchArticle[]> {
    const articles: SearchArticle[] = [];

    // Get all article elements
    const articleElements = await page.$$(
      "article[data-adid], li.ad-listitem article, .aditem"
    );

    console.log(
      `  📦 Page ${pageNum}: Found ${articleElements.length} elements`
    );

    const articlesToProcess = Math.min(articleElements.length, count);

    for (let i = 0; i < articlesToProcess; i++) {
      try {
        const article = await this.scrapeArticleFromElement(page, i);
        if (article) {
          // Optionally fetch full details (slower)
          if (includeDetails && article.url) {
            const details = await this.scrapeArticleDetails(page, article.url);
            if (details) {
              article.description = details.description;
              article.images =
                details.images.length > 0 ? details.images : article.images;
            }
          }
          articles.push(article);
        }
      } catch (error) {
        console.error(`    ⚠️ Failed to scrape article ${i + 1}:`, error);
      }
    }

    return articles;
  }

  private async scrapeArticleFromElement(
    page: Page,
    index: number
  ): Promise<SearchArticle | null> {
    try {
      const article = await page.evaluate((idx) => {
        const articles = document.querySelectorAll(
          "article[data-adid], li.ad-listitem article, .aditem"
        );
        const el = articles[idx] as HTMLElement;

        if (!el) return null;

        // Get article ID
        const id =
          el.getAttribute("data-adid") ||
          el.querySelector("[data-adid]")?.getAttribute("data-adid") ||
          `unknown-${idx}`;

        // Get title
        const titleEl = el.querySelector(
          'a[class*="ellipsis"], h2 a, .aditem-main a, .text-module-begin a'
        ) as HTMLAnchorElement;
        const title = titleEl?.textContent?.trim() || "ad";
        const url = titleEl?.href || "";

        // Get price
        const priceEl = el.querySelector(
          'p[class*="aditem-main--middle--price"], .aditem-main--middle--price-shipping--price, [class*="price"]'
        );
        const priceText = priceEl?.textContent?.trim() || "";

        // Parse price
        let price = "N/A";
        let priceType = "fixed";
        if (priceText.includes("VB")) {
          priceType = "negotiable";
          price = priceText.replace("VB", "").trim();
        } else if (priceText.includes("Zu verschenken")) {
          priceType = "free";
          price = "0 €";
        } else {
          price = priceText;
        }

        // Get location
        const locationEl = el.querySelector(
          '.aditem-main--top--left, [class*="location"], .aditem-details'
        );
        const location = locationEl?.textContent?.trim() || "Unknown";

        // Get date
        const dateEl = el.querySelector(
          '.aditem-main--top--right, [class*="date"]'
        );
        const date = dateEl?.textContent?.trim() || "";

        // Get thumbnail image
        const imgEl = el.querySelector(
          'img[src*="img."], .aditem-image img, .imagebox img'
        ) as HTMLImageElement;
        const thumbnailUrl =
          imgEl?.src || imgEl?.getAttribute("data-src") || "";

        // Get seller info if available
        const sellerEl = el.querySelector(
          '.aditem-details--seller, [class*="seller"]'
        );
        const sellerName = sellerEl?.textContent?.trim() || "";
        const sellerType = sellerEl?.classList.contains("commercial")
          ? "commercial"
          : "private";

        return {
          id,
          title,
          price,
          priceType,
          location,
          date,
          url,
          images: thumbnailUrl ? [thumbnailUrl] : [],
          thumbnailUrl,
          seller: sellerName
            ? { name: sellerName, type: sellerType }
            : undefined,
        };
      }, index);

      return article;
    } catch (error) {
      console.error("Error scraping article element:", error);
      return null;
    }
  }

  private async scrapeArticleDetails(
    _page: Page,
    articleUrl: string
  ): Promise<{ description: string; images: string[] } | null> {
    let detailPage: Page | null = null;

    try {
      detailPage = await this.browser!.newPage();
      await detailPage.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await detailPage.goto(articleUrl, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      // Handle cookie consent on detail page if needed
      await this.handleCookieConsent(detailPage);

      // Wait a bit for images to load
      await this.wait(1000);

      const details = await detailPage.evaluate(() => {
        // Get description
        const descriptionEl = document.querySelector(
          '#viewad-description-text, [id*="description"], .addetailslist'
        );
        const description = descriptionEl?.textContent?.trim() || "";

        // Get all images
        const imageEls = document.querySelectorAll(
          '.galleryimage-element img, #viewad-image img, [class*="gallery"] img, .ad-image img'
        );
        const images: string[] = [];

        imageEls.forEach((img) => {
          const src =
            (img as HTMLImageElement).src ||
            img.getAttribute("data-src") ||
            img.getAttribute("data-imgsrc") ||
            "";
          if (src && !images.includes(src) && !src.includes("placeholder")) {
            // Try to get the full resolution image
            const fullSrc = src
              .replace(/\/\d+x\d+\//, "/1600x1200/")
              .replace("_72.jpg", "_57.jpg");
            images.push(fullSrc);
          }
        });

        return { description, images };
      });

      await detailPage.close();
      return details;
    } catch (error) {
      console.error("Error fetching article details:", error);
      if (detailPage) {
        await detailPage.close().catch(() => {});
      }
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.disconnect();
        this.browser = null;
      } catch (error) {
        console.error("Error disconnecting browser:", error);
      }
    }
  }
}

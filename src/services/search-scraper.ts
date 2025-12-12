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
    seller: {
        name: string;
        type: string;
    } | undefined;
}

export interface SearchResult {
    success: boolean;
    query: string;
    totalFound: number;
    articlesScraped: number;
    articles: SearchArticle[];
    searchUrl: string;
    scrapedAt: string;
    error?: string;
}

export interface SearchOptions {
    query: string;
    count?: number | undefined;
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
        return new Promise(resolve => setTimeout(resolve, ms));
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
                headless: false,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ],
            });
        }
    }

    private buildSearchUrl(options: SearchOptions): string {
        const baseUrl = "https://www.kleinanzeigen.de/s-suchanfrage.html";
        const params = new URLSearchParams();

        // Add search query
        params.set("keywords", options.query);

        // Add location if specified
        if (options.location) {
            params.set("locationStr", options.location);
        }

        // Add radius if specified (in km)
        if (options.radius) {
            params.set("radius", options.radius.toString());
        }

        // Add price range
        if (options.minPrice !== undefined) {
            params.set("minPrice", options.minPrice.toString());
        }
        if (options.maxPrice !== undefined) {
            params.set("maxPrice", options.maxPrice.toString());
        }

        // Add sorting
        if (options.sortBy) {
            params.set("sortingField", options.sortBy);
        }

        return `${baseUrl}?${params.toString()}`;
    }

    async search(options: SearchOptions): Promise<SearchResult> {
        const count = options.count || 10;
        const searchUrl = this.buildSearchUrl(options);

        console.log(`🔍 Searching Kleinanzeigen for: "${options.query}"`);
        console.log(`📊 Requested articles: ${count}`);
        console.log(`🌐 Search URL: ${searchUrl}`);

        let page: Page | null = null;

        try {
            this.browser = await this.connectToBrowser();
            page = await this.browser.newPage();

            // Set a reasonable viewport
            await page.setViewport({ width: 1920, height: 1080 });

            // Set user agent to avoid detection
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Navigate to search page
            console.log("🌐 Navigating to Kleinanzeigen...");
            await page.goto(searchUrl, {
                waitUntil: "networkidle2",
                timeout: 30000,
            });

            // Handle cookie consent if it appears
            await this.handleCookieConsent(page);

            // Wait for results to load
            await page.waitForSelector(
                'article[data-adid], ul.aditem-list li.ad-listitem, .aditem',
                { timeout: 10000 }
            ).catch(() => {
                console.log("⚠️ No results found or page structure changed");
            });

            // Scrape the articles
            const articles = await this.scrapeArticles(page, count, options.includeDetails || false);

            console.log(`✅ Successfully scraped ${articles.length} articles`);

            // Close the page (but keep browser connection)
            await page.close();

            return {
                success: true,
                query: options.query,
                totalFound: articles.length,
                articlesScraped: articles.length,
                articles,
                searchUrl,
                scrapedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error("❌ Search failed:", error);

            if (page) {
                await page.close().catch(() => { });
            }

            return {
                success: false,
                query: options.query,
                totalFound: 0,
                articlesScraped: 0,
                articles: [],
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

    private async scrapeArticles(
        page: Page,
        count: number,
        includeDetails: boolean
    ): Promise<SearchArticle[]> {
        const articles: SearchArticle[] = [];

        // Get all article elements
        const articleElements = await page.$$('article[data-adid], li.ad-listitem article, .aditem');

        console.log(`📦 Found ${articleElements.length} articles on page`);

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
                            article.images = details.images.length > 0 ? details.images : article.images;
                        }
                    }
                    articles.push(article);
                    console.log(`  📄 [${i + 1}/${articlesToProcess}] ${article.title}`);
                }
            } catch (error) {
                console.error(`  ⚠️ Failed to scrape article ${i + 1}:`, error);
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
                    'article[data-adid], li.ad-listitem article, .aditem'
                );
                const el = articles[idx] as HTMLElement;

                if (!el) return null;

                // Get article ID
                const id = el.getAttribute("data-adid") ||
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
                const thumbnailUrl = imgEl?.src || imgEl?.getAttribute("data-src") || "";

                // Get seller info if available
                const sellerEl = el.querySelector('.aditem-details--seller, [class*="seller"]');
                const sellerName = sellerEl?.textContent?.trim() || "";
                const sellerType = sellerEl?.classList.contains("commercial") ? "commercial" : "private";

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
                    seller: sellerName ? { name: sellerName, type: sellerType } : undefined,
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
                    const src = (img as HTMLImageElement).src ||
                        img.getAttribute("data-src") ||
                        img.getAttribute("data-imgsrc") || "";
                    if (src && !images.includes(src) && !src.includes("placeholder")) {
                        // Try to get the full resolution image
                        const fullSrc = src.replace(/\/\d+x\d+\//, "/1600x1200/").replace("_72.jpg", "_57.jpg");
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
                await detailPage.close().catch(() => { });
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

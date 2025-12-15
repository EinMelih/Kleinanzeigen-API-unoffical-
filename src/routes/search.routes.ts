/**
 * Search Routes - /search/*, /scrape
 * Handles Kleinanzeigen search and scraping
 */
import { FastifyInstance } from "fastify";
import { SearchScraper } from "../services/search-scraper";
import { ImageDownloader } from "../services/image-downloader.service";

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  // ============================================
  // POST /search - Search with all filters
  // ============================================
  app.post<{
    Body: {
      query: string;
      count?: number;
      scrapeAll?: boolean;
      location?: string;
      radius?: number;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: "SORTING_DATE" | "PRICE_AMOUNT" | "RELEVANCE";
      includeDetails?: boolean;
      downloadImages?: boolean;
    };
  }>(
    "/search",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            query: { type: "string" },
            count: { type: "number", minimum: 1 },
            scrapeAll: { type: "boolean" },
            location: { type: "string" },
            radius: { type: "number" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            sortBy: {
              type: "string",
              enum: ["SORTING_DATE", "PRICE_AMOUNT", "RELEVANCE"],
            },
            includeDetails: { type: "boolean" },
            downloadImages: { type: "boolean" },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          query,
          count = 10,
          scrapeAll = false,
          location,
          radius,
          minPrice,
          maxPrice,
          sortBy,
          includeDetails = false,
          downloadImages = false,
        } = request.body;

        const scraper = new SearchScraper();
        const imageDownloader = new ImageDownloader();

        try {
          const result = await scraper.search({
            query,
            count: scrapeAll ? undefined : count,
            scrapeAll,
            location,
            radius,
            minPrice,
            maxPrice,
            sortBy,
            includeDetails,
          });

          // Download images if requested
          if (downloadImages && result.articles) {
            // Erstelle Such-Ordner Name
            const searchFolder = ImageDownloader.createSearchFolderName({
              query,
              location,
              radius,
              count: scrapeAll ? result.articlesScraped : count,
            });

            for (const article of result.articles) {
              if (article.images && article.images.length > 0) {
                const downloaded = await imageDownloader.downloadImages({
                  articleId: article.id,
                  urls: article.images,
                  searchFolder,
                  articleInfo: {
                    id: article.id,
                    title: article.title,
                    price: article.price,
                    location: article.location,
                    url: article.url,
                  },
                });

                // Add downloaded paths to article
                (
                  article as unknown as {
                    downloadedImages?: Array<{
                      url: string;
                      localPath: string;
                    }>;
                  }
                ).downloadedImages = downloaded
                  .filter((d) => d.success)
                  .map((d) => ({ url: d.url, localPath: d.localPath }));
              }
            }
          }

          return reply.send({
            status: "success",
            result,
            imagesDownloaded: downloadImages,
            imageFolder: downloadImages
              ? `data/images/search/${ImageDownloader.createSearchFolderName({
                  query,
                  location,
                  radius,
                  count: scrapeAll ? result.articlesScraped : count,
                })}`
              : undefined,
            timestamp: new Date().toISOString(),
          });
        } finally {
          await scraper.disconnect();
        }
      } catch (err) {
        request.log.error({ err }, "search failed");
        return reply.status(500).send({
          status: "error",
          message: err instanceof Error ? err.message : "Search failed",
        });
      }
    }
  );

  // ============================================
  // GET /search - Quick search
  // ============================================
  app.get<{
    Querystring: {
      q: string;
      count?: string;
      location?: string;
      download?: string;
    };
  }>("/search", async (request, reply) => {
    try {
      const { q, count = "10", location, download } = request.query;

      if (!q) {
        return reply.status(400).send({
          status: "error",
          message: "Query parameter 'q' is required",
        });
      }

      const scraper = new SearchScraper();
      const imageDownloader = new ImageDownloader();
      const shouldDownload = download === "true" || download === "1";

      try {
        const result = await scraper.search({
          query: q,
          count: parseInt(count) || 10,
          location,
        });

        // Download images if requested
        if (shouldDownload && result.articles) {
          const searchFolder = ImageDownloader.createSearchFolderName({
            query: q,
            location,
            count: parseInt(count) || 10,
          });

          for (const article of result.articles) {
            if (article.images && article.images.length > 0) {
              const downloaded = await imageDownloader.downloadImages({
                articleId: article.id,
                urls: article.images,
                searchFolder,
                articleInfo: {
                  id: article.id,
                  title: article.title,
                  price: article.price,
                  location: article.location,
                  url: article.url,
                },
              });

              (
                article as unknown as {
                  downloadedImages?: Array<{ url: string; localPath: string }>;
                }
              ).downloadedImages = downloaded
                .filter((d) => d.success)
                .map((d) => ({ url: d.url, localPath: d.localPath }));
            }
          }
        }

        return reply.send({
          status: "success",
          result,
          imagesDownloaded: shouldDownload,
          timestamp: new Date().toISOString(),
        });
      } finally {
        await scraper.disconnect();
      }
    } catch (err) {
      request.log.error({ err }, "search failed");
      return reply.status(500).send({
        status: "error",
        message: err instanceof Error ? err.message : "Search failed",
      });
    }
  });

  // ============================================
  // POST /scrape - Scrape specific article URLs
  // ============================================
  app.post<{
    Body: {
      urls: string[];
      downloadImages?: boolean;
    };
  }>(
    "/scrape",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            urls: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 50,
            },
            downloadImages: { type: "boolean" },
          },
          required: ["urls"],
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const { urls, downloadImages = false } = request.body;

        const scraper = new SearchScraper();
        const imageDownloader = new ImageDownloader();
        const results: Array<{
          url: string;
          success: boolean;
          article?: Record<string, unknown>;
          error?: string;
        }> = [];

        try {
          for (const url of urls) {
            try {
              // Scrape article details
              const browser = await (
                scraper as unknown as {
                  connectToBrowser: () => Promise<unknown>;
                }
              ).connectToBrowser();
              const page = (await (
                browser as { newPage: () => Promise<unknown> }
              ).newPage()) as import("puppeteer").Page;

              await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 30000,
              });

              // Scroll um Lazy-Loading zu triggern
              await page.evaluate(() => {
                window.scrollTo(0, 300);
              });

              // Warte auf Bilder-Laden
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // Extract article data
              const articleData = await page.evaluate(() => {
                // Titel bereinigen - Status-Badges entfernen
                let rawTitle =
                  document
                    .querySelector("#viewad-title")
                    ?.textContent?.trim() || "";
                // Remove "Reserviert", "Gelöscht", bullets and clean whitespace
                const title = rawTitle
                  .replace(/Reserviert\s*[•·]?\s*/gi, "")
                  .replace(/Gelöscht\s*[•·]?\s*/gi, "")
                  .replace(/[•·]\s*/g, "")
                  .replace(/\s+/g, " ")
                  .trim();
                const price =
                  document
                    .querySelector("#viewad-price")
                    ?.textContent?.trim() || "";
                const description =
                  document
                    .querySelector("#viewad-description-text")
                    ?.textContent?.trim() || "";
                const location =
                  document
                    .querySelector("#viewad-locality")
                    ?.textContent?.trim() || "";

                // Datum: nur das erste Element (nicht Aufrufe-Zahl)
                const dateEl = document.querySelector(
                  "#viewad-extra-info span, #viewad-extra-info li:first-child"
                );
                const date = dateEl?.textContent?.trim() || "";

                // Get all images - ONLY from the article gallery
                const images: string[] = [];
                const seenImageIds = new Set<string>();

                // Hilfsfunktion: Extrahiere Bild-ID aus URL
                const getImageId = (url: string): string => {
                  const match = url.match(
                    /images\/([a-f0-9]{2})\/([a-f0-9-]+)/i
                  );
                  return match && match[2] ? match[2] : url;
                };

                // 1. Versuche Thumbnails aus der Galerie-Leiste (sind meistens alle geladen)
                document
                  .querySelectorAll(
                    ".galleryitem img, " +
                      ".gallery-thumbnail img, " +
                      "[data-testid='gallery-thumbnails'] img, " +
                      ".imagebox-thumbnail img"
                  )
                  .forEach((img) => {
                    // Hole die große Version der URL (ersetze $_ mit $_59 für größere Bilder)
                    let src =
                      img.getAttribute("src") ||
                      img.getAttribute("data-src") ||
                      img.getAttribute("data-imgsrc");
                    if (src && src.includes("kleinanzeigen.de")) {
                      // Upgrade zu größerer Version wenn möglich
                      src = src.replace(/\$_\d+\./, "$_59.");
                      const imageId = getImageId(src);
                      if (
                        !seenImageIds.has(imageId) &&
                        !src.includes("placeholder") &&
                        !src.includes("avatar")
                      ) {
                        seenImageIds.add(imageId);
                        images.push(src);
                      }
                    }
                  });

                // 2. Falls keine Thumbnails, versuche Hauptbild + Gallery Container
                if (images.length === 0) {
                  document
                    .querySelectorAll(
                      "#viewad-image img, " +
                        "#viewad-gallery img, " +
                        ".galleryimage-element img, " +
                        "[data-testid='gallery'] img"
                    )
                    .forEach((img) => {
                      const src =
                        img.getAttribute("src") || img.getAttribute("data-src");
                      if (src && src.includes("kleinanzeigen.de")) {
                        const imageId = getImageId(src);
                        if (
                          !seenImageIds.has(imageId) &&
                          !src.includes("placeholder")
                        ) {
                          seenImageIds.add(imageId);
                          images.push(src);
                        }
                      }
                    });
                }

                // 3. Fallback: OG-Image
                if (images.length === 0) {
                  const ogImage = document.querySelector(
                    'meta[property="og:image"]'
                  );
                  if (ogImage) {
                    const content = ogImage.getAttribute("content");
                    if (content) images.push(content);
                  }
                }

                // Get seller info - EXTENDED
                const sellerName =
                  document
                    .querySelector(
                      "#viewad-contact .text-body-regular-strong, #viewad-contact .userprofile-vip a"
                    )
                    ?.textContent?.trim() || "";
                const sellerLink =
                  document
                    .querySelector(
                      "#viewad-contact a[href*='/s-bestandsliste']"
                    )
                    ?.getAttribute("href") || "";

                // User ID aus Link extrahieren
                const userIdMatch = sellerLink.match(/userId=(\d+)/);
                const sellerId =
                  userIdMatch && userIdMatch[1] ? userIdMatch[1] : "";

                // Telefonnummer
                const phoneLink = document.querySelector(
                  "#viewad-contact a[href^='tel:']"
                );
                const phone = phoneLink
                  ? phoneLink.getAttribute("href")?.replace("tel:", "") || ""
                  : "";

                // Seller-Typ (gewerblich/privat) - check via text
                const contactSection =
                  document.querySelector("#viewad-contact");
                const contactText = contactSection?.textContent || "";
                const isCommercial =
                  contactText.includes("Gewerblicher Nutzer") ||
                  contactText.includes("Gewerblicher Anbieter") ||
                  document.querySelector(
                    ".badge-hint-pro-small, .icon-user-commercial"
                  ) !== null;

                // Badges - extract from .userbadge-tag elements
                const badges: string[] = [];
                document
                  .querySelectorAll(".userbadge-tag, [class*='userbadge'] span")
                  .forEach((badge) => {
                    const text = badge.textContent?.trim().toLowerCase() || "";
                    if (
                      text.includes("zufriedenheit") ||
                      text.includes("top")
                    ) {
                      if (!badges.includes("TOP_SATISFACTION"))
                        badges.push("TOP_SATISFACTION");
                    }
                    if (text.includes("freundlich")) {
                      if (!badges.includes("FRIENDLY")) badges.push("FRIENDLY");
                    }
                    if (text.includes("zuverlässig")) {
                      if (!badges.includes("RELIABLE")) badges.push("RELIABLE");
                    }
                    if (text.includes("verifiziert")) {
                      if (!badges.includes("VERIFIED")) badges.push("VERIFIED");
                    }
                  });

                // Aktiv seit
                const activeSinceEl = document.querySelector(
                  ".userprofile-vip-since, [data-testid='member-since']"
                );
                const activeSince =
                  activeSinceEl?.textContent
                    ?.replace("Aktiv seit", "")
                    .trim() || "";

                // Anzahl Anzeigen
                const totalAdsEl = document.querySelector(
                  ".userprofile-vip-ads, [data-testid='ad-count']"
                );
                const totalAdsMatch = totalAdsEl?.textContent?.match(/(\d+)/);
                const totalAds =
                  totalAdsMatch && totalAdsMatch[1]
                    ? parseInt(totalAdsMatch[1])
                    : 0;

                // Extract ID from URL - Format: /.../3200961604-280-1773
                const urlMatch =
                  window.location.pathname.match(/\/(\d+)-\d+-\d+$/);
                const id = urlMatch && urlMatch[1] ? urlMatch[1] : "";

                return {
                  id,
                  title,
                  price,
                  description,
                  location,
                  date,
                  images,
                  seller: {
                    name: sellerName,
                    id: sellerId,
                    type: (isCommercial ? "commercial" : "private") as
                      | "commercial"
                      | "private",
                    phone: phone || undefined,
                    badges,
                    activeSince: activeSince || undefined,
                    totalAds: totalAds || undefined,
                    profileUrl: sellerLink,
                  },
                };
              });

              await page.close();

              // Download images if requested
              let downloadedImages: Array<{ url: string; localPath: string }> =
                [];
              if (downloadImages && articleData.images.length > 0) {
                // Erstelle Ordner für Scrape-Requests
                const scrapeFolder = `scrape_${
                  new Date().toISOString().split("T")[0]
                }`;

                const downloaded = await imageDownloader.downloadImages({
                  articleId: articleData.id || `article_${Date.now()}`,
                  urls: articleData.images,
                  searchFolder: scrapeFolder,
                  articleInfo: {
                    id: articleData.id || `unknown_${Date.now()}`,
                    title: articleData.title,
                    price: articleData.price,
                    location: articleData.location,
                    url: url,
                    description: articleData.description,
                    date: articleData.date,
                    seller: articleData.seller,
                  },
                });

                downloadedImages = downloaded
                  .filter((d) => d.success)
                  .map((d) => ({ url: d.url, localPath: d.localPath }));
              }

              results.push({
                url,
                success: true,
                article: {
                  ...articleData,
                  sourceUrl: url,
                  downloadedImages: downloadImages
                    ? downloadedImages
                    : undefined,
                },
              });
            } catch (articleError) {
              results.push({
                url,
                success: false,
                error:
                  articleError instanceof Error
                    ? articleError.message
                    : "Scrape failed",
              });
            }
          }

          return reply.send({
            status: "success",
            totalUrls: urls.length,
            successfulScrapes: results.filter((r) => r.success).length,
            failedScrapes: results.filter((r) => !r.success).length,
            results,
            timestamp: new Date().toISOString(),
          });
        } finally {
          await scraper.disconnect();
        }
      } catch (err) {
        request.log.error({ err }, "scrape failed");
        return reply.status(500).send({
          status: "error",
          message: err instanceof Error ? err.message : "Scrape failed",
        });
      }
    }
  );
}

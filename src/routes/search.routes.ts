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
          for (const article of result.articles) {
            if (article.images && article.images.length > 0) {
              const downloaded = await imageDownloader.downloadImages({
                articleId: article.id,
                urls: article.images,
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

              // Extract article data
              const articleData = await page.evaluate(() => {
                const title =
                  document
                    .querySelector("#viewad-title")
                    ?.textContent?.trim() || "";
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
                const date =
                  document
                    .querySelector("#viewad-extra-info")
                    ?.textContent?.trim() || "";

                // Get all images - ONLY from the article gallery, not from related articles
                const images: string[] = [];
                const seenImageIds = new Set<string>();

                // Hilfsfunktion: Extrahiere Bild-ID aus URL
                const getImageId = (url: string): string => {
                  // URLs wie: .../images/fd/fd545056-0af4-44f5-aab8-167e316fe6d7?rule=...
                  const match = url.match(
                    /images\/([a-f0-9]{2})\/([a-f0-9-]+)/i
                  );
                  return match && match[2] ? match[2] : url;
                };

                // WICHTIG: Nur Bilder aus dem Haupt-Artikel-Container!
                const articleContainer = document.querySelector(
                  "#viewad-product, #viewad-gallery, .ad-keydetails"
                );

                if (articleContainer) {
                  articleContainer.querySelectorAll("img").forEach((img) => {
                    const src =
                      img.getAttribute("src") ||
                      img.getAttribute("data-src") ||
                      img.getAttribute("data-imgsrc");
                    if (src && src.includes("kleinanzeigen.de")) {
                      const imageId = getImageId(src);
                      // Nur hinzufügen wenn diese Bild-ID noch nicht gesehen wurde
                      if (
                        !seenImageIds.has(imageId) &&
                        !src.includes("placeholder") &&
                        !src.includes("avatar") &&
                        !src.includes("icon")
                      ) {
                        seenImageIds.add(imageId);
                        images.push(src);
                      }
                    }
                  });
                }

                // Falls keine Bilder gefunden, versuche spezifischeren Selektor
                if (images.length === 0) {
                  document
                    .querySelectorAll(
                      "#viewad-image img, .galleryimage-element img"
                    )
                    .forEach((img) => {
                      const src =
                        img.getAttribute("src") || img.getAttribute("data-src");
                      if (src) {
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

                // Fallback: OG-Image
                if (images.length === 0) {
                  const ogImage = document.querySelector(
                    'meta[property="og:image"]'
                  );
                  if (ogImage) {
                    const content = ogImage.getAttribute("content");
                    if (content) images.push(content);
                  }
                }

                // Get seller info
                const sellerName =
                  document
                    .querySelector("#viewad-contact .text-body-regular-strong")
                    ?.textContent?.trim() || "";
                const sellerLink =
                  document
                    .querySelector(
                      "#viewad-contact a[href*='/s-bestandsliste']"
                    )
                    ?.getAttribute("href") || "";

                // Extract ID from URL
                const urlMatch = window.location.pathname.match(/\/(\d+)$/);
                const id = urlMatch ? urlMatch[1] : "";

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
                    profileUrl: sellerLink,
                  },
                };
              });

              await page.close();

              // Download images if requested
              let downloadedImages: Array<{ url: string; localPath: string }> =
                [];
              if (downloadImages && articleData.images.length > 0) {
                const downloaded = await imageDownloader.downloadImages({
                  articleId: articleData.id || `article_${Date.now()}`,
                  urls: articleData.images,
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

/**
 * Search Routes - /search/*, /scrape
 * Handles Kleinanzeigen search and scraping
 */
import { FastifyInstance } from "fastify";
import { SearchScraper } from "../services/search-scraper";
import { ImageDownloader } from "../services/image-downloader.service";
import * as fs from "fs";
import * as path from "path";

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

                // Aktiv seit - auch aus contactText extrahieren
                let activeSince: string | undefined;
                const activeSinceMatch = contactText.match(
                  /Aktiv seit\s+(\d{2}\.\d{2}\.\d{4})/i
                );
                if (activeSinceMatch && activeSinceMatch[1]) {
                  activeSince = activeSinceMatch[1];
                } else {
                  const activeSinceEl = document.querySelector(
                    ".userprofile-vip-since, [data-testid='member-since']"
                  );
                  activeSince =
                    activeSinceEl?.textContent
                      ?.replace("Aktiv seit", "")
                      .trim() || undefined;
                }

                // Anzahl Anzeigen - aus contactText oder Element
                let activeListings: number | undefined;
                const activeListingsMatch = contactText.match(
                  /(\d+)\s*Anzeigen?\s*(online)?/i
                );
                if (activeListingsMatch && activeListingsMatch[1]) {
                  activeListings = parseInt(activeListingsMatch[1]);
                } else {
                  const totalAdsEl = document.querySelector(
                    ".userprofile-vip-ads, [data-testid='ad-count']"
                  );
                  const totalAdsMatch = totalAdsEl?.textContent?.match(/(\d+)/);
                  activeListings =
                    totalAdsMatch && totalAdsMatch[1]
                      ? parseInt(totalAdsMatch[1])
                      : undefined;
                }

                // Rating text (Freundlich, OK Zufriedenheit, etc.)
                const ratingText = (() => {
                  const possibleTexts = [
                    "Freundlich",
                    "OK Zufriedenheit",
                    "TOP Zufriedenheit",
                  ];
                  for (const t of possibleTexts) {
                    if (contactText.includes(t)) return t;
                  }
                  return undefined;
                })();

                // Antwortzeit
                const responseTimeMatch = contactText.match(
                  /Antwortet\s+(in der Regel\s+)?innerhalb\s+von\s+([^\.]+)/i
                );
                const responseTime = responseTimeMatch
                  ? responseTimeMatch[0].trim()
                  : undefined;

                // Follower
                const followerMatch = contactText.match(/(\d+)\s*Follower/i);
                const followerCount =
                  followerMatch && followerMatch[1]
                    ? parseInt(followerMatch[1])
                    : undefined;

                // Extract ID from URL - improved regex for all URL formats
                // Formats: /s-anzeige/title/3274864391-22-1312 OR /s-anzeige/3274864391
                const urlMatch = window.location.pathname.match(
                  /\/(\d+)(?:-\d+-\d+)?$/
                );
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
                    ratingText,
                    activeSince,
                    responseTime,
                    followerCount,
                    activeListings,
                    profileUrl: sellerLink,
                  },
                };
              });

              await page.close();

              // Download images if requested
              let downloadedImages: Array<{ url: string; localPath: string }> =
                [];
              if (downloadImages && articleData.images.length > 0) {
                // Extrahiere ID aus URL falls articleData.id leer
                const extractedId =
                  articleData.id ||
                  url.match(/\/(\d+)(?:-\d+-\d+)?$/)?.[1] ||
                  url.match(/\/(\d+)$/)?.[1] ||
                  `unknown_${Date.now()}`;

                // Erstelle Ordner mit konsistenter Struktur: article_{ID}_{DATUM}
                const scrapeFolder = `article_${extractedId}_${
                  new Date().toISOString().split("T")[0]
                }`;

                const downloaded = await imageDownloader.downloadImages({
                  articleId: extractedId,
                  urls: articleData.images,
                  searchFolder: scrapeFolder,
                  articleInfo: {
                    id: extractedId,
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

  // ============================================
  // GET /article/:id - Scrape single article by ID
  // ============================================
  app.get<{
    Params: { id: string };
    Querystring: { download?: string };
  }>(
    "/article/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^[0-9]+$" },
          },
          required: ["id"],
        },
        querystring: {
          type: "object",
          properties: {
            download: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const shouldDownload =
          request.query.download === "true" || request.query.download === "1";

        const articleUrl = `https://www.kleinanzeigen.de/s-anzeige/${id}`;
        const scraper = new SearchScraper();
        const imageDownloader = new ImageDownloader();

        try {
          // Connect and scrape
          const browser = await (
            scraper as unknown as {
              connectToBrowser: () => Promise<unknown>;
            }
          ).connectToBrowser();
          const page = (await (
            browser as { newPage: () => Promise<unknown> }
          ).newPage()) as import("puppeteer").Page;

          await page.goto(articleUrl, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });

          // Scroll to trigger lazy loading
          await page.evaluate(() => {
            window.scrollTo(0, 300);
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Extract article data (same logic as /scrape)
          const articleData = await page.evaluate(() => {
            let rawTitle =
              document.querySelector("#viewad-title")?.textContent?.trim() ||
              "";
            const title = rawTitle
              .replace(/Reserviert\s*[•·]?\s*/gi, "")
              .replace(/Gelöscht\s*[•·]?\s*/gi, "")
              .replace(/[•·]\s*/g, "")
              .replace(/\s+/g, " ")
              .trim();

            const price =
              document.querySelector("#viewad-price")?.textContent?.trim() ||
              "";
            const description =
              document
                .querySelector("#viewad-description-text")
                ?.textContent?.trim() || "";
            const location =
              document.querySelector("#viewad-locality")?.textContent?.trim() ||
              "";
            const dateEl = document.querySelector(
              "#viewad-extra-info span, #viewad-extra-info li:first-child"
            );
            const date = dateEl?.textContent?.trim() || "";

            // Images
            const images: string[] = [];
            const seenImageIds = new Set<string>();
            const getImageId = (url: string): string => {
              const match = url.match(/images\/([a-f0-9]{2})\/([a-f0-9-]+)/i);
              return match && match[2] ? match[2] : url;
            };

            document
              .querySelectorAll(
                ".galleryitem img, .gallery-thumbnail img, [data-testid='gallery-thumbnails'] img, .imagebox-thumbnail img"
              )
              .forEach((img) => {
                let src =
                  img.getAttribute("src") ||
                  img.getAttribute("data-src") ||
                  img.getAttribute("data-imgsrc");
                if (src && src.includes("kleinanzeigen.de")) {
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

            if (images.length === 0) {
              document
                .querySelectorAll(
                  "#viewad-image img, #viewad-gallery img, .galleryimage-element img"
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

            // Seller info
            const sellerName =
              document
                .querySelector(
                  "#viewad-contact .text-body-regular-strong, #viewad-contact .userprofile-vip a"
                )
                ?.textContent?.trim() || "";
            const sellerLink =
              document
                .querySelector("#viewad-contact a[href*='/s-bestandsliste']")
                ?.getAttribute("href") || "";
            const userIdMatch = sellerLink.match(/userId=(\d+)/);
            const sellerId =
              userIdMatch && userIdMatch[1] ? userIdMatch[1] : "";

            const contactSection = document.querySelector("#viewad-contact");
            const contactText = contactSection?.textContent || "";

            const isCommercial =
              contactText.includes("Gewerblicher Nutzer") ||
              contactText.includes("Gewerblicher Anbieter") ||
              document.querySelector(
                ".badge-hint-pro-small, .icon-user-commercial"
              ) !== null;

            // Badges
            const badges: string[] = [];
            document
              .querySelectorAll(".userbadge-tag, [class*='userbadge'] span")
              .forEach((badge) => {
                const text = badge.textContent?.trim().toLowerCase() || "";
                if (text.includes("zufriedenheit") || text.includes("top")) {
                  if (!badges.includes("TOP_SATISFACTION"))
                    badges.push("TOP_SATISFACTION");
                }
                if (text.includes("freundlich")) {
                  if (!badges.includes("FRIENDLY")) badges.push("FRIENDLY");
                }
              });

            // Rating text
            const ratingText = (() => {
              const possibleTexts = [
                "Freundlich",
                "OK Zufriedenheit",
                "TOP Zufriedenheit",
              ];
              for (const t of possibleTexts) {
                if (contactText.includes(t)) return t;
              }
              return undefined;
            })();

            // Aktiv seit
            const activeSinceMatch = contactText.match(
              /Aktiv seit\s+(\d{2}\.\d{2}\.\d{4})/i
            );
            const activeSince =
              activeSinceMatch && activeSinceMatch[1]
                ? activeSinceMatch[1]
                : undefined;

            // Antwortzeit
            const responseTimeMatch = contactText.match(
              /Antwortet\s+(in der Regel\s+)?innerhalb\s+von\s+([^\.]+)/i
            );
            const responseTime = responseTimeMatch
              ? responseTimeMatch[0].trim()
              : undefined;

            // Follower
            const followerMatch = contactText.match(/(\d+)\s*Follower/i);
            const followerCount =
              followerMatch && followerMatch[1]
                ? parseInt(followerMatch[1])
                : undefined;

            // Anzahl Anzeigen online
            const activeListingsMatch = contactText.match(
              /(\d+)\s*Anzeigen?\s*(online)?/i
            );
            const activeListings =
              activeListingsMatch && activeListingsMatch[1]
                ? parseInt(activeListingsMatch[1])
                : undefined;

            // ID from URL
            const urlMatch = window.location.pathname.match(
              /\/(\d+)(?:-\d+-\d+)?$/
            );
            const articleId = urlMatch && urlMatch[1] ? urlMatch[1] : "";

            return {
              id: articleId,
              title,
              price,
              description,
              location,
              date,
              url: window.location.href,
              images,
              imageCount: images.length,
              seller: {
                name: sellerName,
                id: sellerId,
                type: (isCommercial ? "commercial" : "private") as
                  | "commercial"
                  | "private",
                badges,
                ratingText,
                activeSince,
                responseTime,
                followerCount,
                activeListings,
                profileUrl: sellerLink,
              },
            };
          });

          await page.close();

          // Download images if requested
          let downloadedImages: Array<{ url: string; localPath: string }> = [];
          if (shouldDownload && articleData.images.length > 0) {
            const scrapeFolder = `article_${id}_${
              new Date().toISOString().split("T")[0]
            }`;

            const downloaded = await imageDownloader.downloadImages({
              articleId: articleData.id || id,
              urls: articleData.images,
              searchFolder: scrapeFolder,
              articleInfo: {
                id: articleData.id || id,
                title: articleData.title,
                price: articleData.price,
                location: articleData.location,
                url: articleUrl,
                description: articleData.description,
                date: articleData.date,
                seller: articleData.seller,
              },
            });

            downloadedImages = downloaded
              .filter((d) => d.success)
              .map((d) => ({ url: d.url, localPath: d.localPath }));
          }

          return reply.send({
            status: "success",
            article: {
              ...articleData,
              downloadedImages: shouldDownload ? downloadedImages : undefined,
            },
            imagesDownloaded: shouldDownload,
            timestamp: new Date().toISOString(),
          });
        } finally {
          await scraper.disconnect();
        }
      } catch (err) {
        request.log.error({ err }, "article scrape failed");
        return reply.status(500).send({
          status: "error",
          message: err instanceof Error ? err.message : "Article scrape failed",
        });
      }
    }
  );

  // ============================================
  // GET /local-searches - List all saved search folders
  // ============================================
  app.get("/local-searches", async (_request, reply) => {
    try {
      const searchDir = path.join(process.cwd(), "data", "images", "search");

      if (!fs.existsSync(searchDir)) {
        return reply.send({
          status: "success",
          folders: [],
          message: "No local searches found",
        });
      }

      const folders = fs
        .readdirSync(searchDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => {
          const folderPath = path.join(searchDir, dirent.name);
          const articleFolders = fs
            .readdirSync(folderPath, { withFileTypes: true })
            .filter((d) => d.isDirectory()).length;

          return {
            name: dirent.name,
            articleCount: articleFolders,
            path: `/local-search/${encodeURIComponent(dirent.name)}`,
          };
        })
        .sort((a, b) => b.name.localeCompare(a.name)); // Newest first

      return reply.send({
        status: "success",
        count: folders.length,
        folders,
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to list local searches",
      });
    }
  });

  // ============================================
  // GET /local-search/:folder - Get articles from a local search folder
  // ============================================
  app.get<{
    Params: { folder: string };
  }>("/local-search/:folder", async (request, reply) => {
    try {
      const { folder } = request.params;
      const folderPath = path.join(
        process.cwd(),
        "data",
        "images",
        "search",
        folder
      );

      if (!fs.existsSync(folderPath)) {
        return reply.status(404).send({
          status: "error",
          message: "Search folder not found",
        });
      }

      const articles: Array<{
        id: string;
        title: string;
        price: string;
        location: string;
        url: string;
        description?: string;
        date?: string;
        seller?: Record<string, unknown>;
        images: string[];
        localImages: string[];
      }> = [];

      const articleFolders = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((d) => d.isDirectory());

      for (const articleDir of articleFolders) {
        const articlePath = path.join(folderPath, articleDir.name);
        const infoPath = path.join(articlePath, "article-info.json");

        try {
          if (fs.existsSync(infoPath)) {
            const infoContent = fs.readFileSync(infoPath, "utf-8");
            const info = JSON.parse(infoContent);

            // Get local image files
            const imageFiles = fs
              .readdirSync(articlePath)
              .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
              .map((f) => `/images/search/${folder}/${articleDir.name}/${f}`);

            articles.push({
              ...info,
              localImages: imageFiles,
              images: imageFiles, // Override remote images with local paths
            });
          }
        } catch (parseErr) {
          // Skip articles with invalid JSON
          console.error(`Failed to parse ${infoPath}:`, parseErr);
        }
      }

      return reply.send({
        status: "success",
        folder,
        count: articles.length,
        articles,
      });
    } catch (err) {
      return reply.status(500).send({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to load local search",
      });
    }
  });

  // ============================================
  // GET /images/* - Serve local images statically
  // ============================================
  app.get("/images/*", async (request, reply) => {
    try {
      const imagePath = (request.params as { "*": string })["*"];
      const fullPath = path.join(process.cwd(), "data", "images", imagePath);

      // Security check - prevent directory traversal
      const normalizedPath = path.normalize(fullPath);
      const dataDir = path.join(process.cwd(), "data", "images");
      if (!normalizedPath.startsWith(dataDir)) {
        return reply.status(403).send({ error: "Access denied" });
      }

      if (!fs.existsSync(fullPath)) {
        return reply.status(404).send({ error: "Image not found" });
      }

      // Determine content type
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };

      const contentType = contentTypes[ext] || "application/octet-stream";
      const imageBuffer = fs.readFileSync(fullPath);

      return reply
        .header("Content-Type", contentType)
        .header("Cache-Control", "public, max-age=86400")
        .send(imageBuffer);
    } catch (err) {
      return reply.status(500).send({
        error: err instanceof Error ? err.message : "Failed to serve image",
      });
    }
  });
}

/**
 * Image Downloader Service
 *
 * Downloads article images and saves them locally.
 * Returns both URL and local file path.
 */
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

// ============================================
// CONFIGURATION
// ============================================

const IMAGE_DIR = path.join(process.cwd(), "data", "images");

// Ensure directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// ============================================
// TYPES
// ============================================

export interface DownloadedImage {
  /** Original URL */
  url: string;

  /** Local file path (relative to project root) */
  localPath: string;

  /** Absolute file path */
  absolutePath: string;

  /** File size in bytes */
  size: number;

  /** Download successful? */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

export interface ArticleInfo {
  /** Artikel-ID */
  id: string;
  /** Titel der Anzeige */
  title?: string;
  /** Preis */
  price?: string;
  /** Standort */
  location?: string;
  /** URL zur Anzeige */
  url?: string;
  /** Beschreibung */
  description?: string;
  /** Erstellungsdatum */
  date?: string;
  /** Verkäufer-Infos */
  seller?: {
    name?: string | undefined;
    id?: string | undefined;
    type?: "commercial" | "private" | undefined;
    phone?: string | undefined;
    badges?: string[] | undefined;
    activeSince?: string | undefined;
    totalAds?: number | undefined;
    profileUrl?: string | undefined;
  };
}

export interface ImageDownloadOptions {
  /** Article ID (for folder organization) */
  articleId: string;

  /** Image URLs to download */
  urls: string[];

  /** Skip if already exists */
  skipExisting?: boolean;

  /** Max concurrent downloads */
  concurrency?: number;

  /**
   * Search folder name for organization
   * Format: query_location_radius_count (e.g., "iPhone15_Koeln_70km_40pc")
   */
  searchFolder?: string;

  /**
   * Artikel-Informationen für article-info.json
   */
  articleInfo?: ArticleInfo;
}

// ============================================
// IMAGE DOWNLOADER CLASS
// ============================================

export class ImageDownloader {
  /**
   * Erstellt einen Such-Ordner Namen aus den Suchparametern
   * Beispiel: "iPhone15_Koeln_70km_40pc_2024-12-13"
   */
  static createSearchFolderName(options: {
    query: string;
    location?: string | undefined;
    radius?: number | undefined;
    count?: number | undefined;
  }): string {
    const parts: string[] = [];

    // Query bereinigen (Sonderzeichen entfernen)
    const cleanQuery = options.query
      .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 30);
    parts.push(cleanQuery);

    // Location hinzufügen
    if (options.location) {
      const cleanLocation = options.location
        .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "")
        .substring(0, 20);
      parts.push(cleanLocation);
    }

    // Radius hinzufügen
    if (options.radius) {
      parts.push(`${options.radius}km`);
    }

    // Count hinzufügen
    if (options.count) {
      parts.push(`${options.count}pc`);
    }

    // Datum hinzufügen
    const date = new Date().toISOString().split("T")[0];
    parts.push(date || "");

    return parts.join("_");
  }

  /**
   * Erstellt einen Artikel-Ordner Namen aus Titel + ID
   * Beispiel: "iPhone_15_Pro_256GB_123456789"
   */
  static createArticleFolderName(id: string, title?: string): string {
    if (!title) return id;

    const cleanTitle = title
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 40);

    return `${cleanTitle}_${id}`;
  }

  /**
   * Downloads multiple images for an article
   */
  async downloadImages(
    options: ImageDownloadOptions
  ): Promise<DownloadedImage[]> {
    const {
      articleId,
      urls,
      skipExisting = true,
      searchFolder,
      articleInfo,
    } = options;
    const results: DownloadedImage[] = [];

    // Erstelle Ordnername aus Titel + ID
    const folderName = ImageDownloader.createArticleFolderName(
      articleId,
      articleInfo?.title
    );

    // Create folder structure: data/images/[searchFolder]/[folderName]/
    let articleDir: string;
    if (searchFolder) {
      articleDir = path.join(IMAGE_DIR, "search", searchFolder, folderName);
    } else {
      articleDir = path.join(IMAGE_DIR, folderName);
    }

    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    // Speichere article-info.json wenn Infos vorhanden
    if (articleInfo) {
      const infoPath = path.join(articleDir, "article-info.json");
      const infoData = {
        ...articleInfo,
        downloadedAt: new Date().toISOString(),
        imageCount: urls.length,
      };
      fs.writeFileSync(infoPath, JSON.stringify(infoData, null, 2));
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue;
      const result = await this.downloadSingleImage(
        url,
        articleDir,
        i,
        skipExisting
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Downloads a single image
   */
  private async downloadSingleImage(
    url: string,
    targetDir: string,
    index: number,
    skipExisting: boolean
  ): Promise<DownloadedImage> {
    try {
      // Generate filename
      const extension = this.getExtension(url);
      const filename = `image_${index}${extension}`;
      const absolutePath = path.join(targetDir, filename);
      const localPath = path.relative(process.cwd(), absolutePath);

      // Skip if exists
      if (skipExisting && fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        return {
          url,
          localPath,
          absolutePath,
          size: stats.size,
          success: true,
        };
      }

      // Download image
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // Save to file
      fs.writeFileSync(absolutePath, response.data);

      return {
        url,
        localPath,
        absolutePath,
        size: response.data.length,
        success: true,
      };
    } catch (error) {
      return {
        url,
        localPath: "",
        absolutePath: "",
        size: 0,
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  /**
   * Extracts file extension from URL
   */
  private getExtension(url: string): string {
    const urlWithoutParams = url.split("?")[0] || url;
    const parts = urlWithoutParams.split(".");
    const ext = parts[parts.length - 1]?.toLowerCase() || "jpg";

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return `.${ext}`;
    }

    return ".jpg"; // Default
  }

  /**
   * Gets the image directory for an article
   */
  getArticleImageDir(articleId: string): string {
    return path.join(IMAGE_DIR, articleId);
  }

  /**
   * Checks if images exist for an article
   */
  hasDownloadedImages(articleId: string): boolean {
    const dir = this.getArticleImageDir(articleId);
    if (!fs.existsSync(dir)) return false;

    const files = fs.readdirSync(dir);
    return files.some((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  }

  /**
   * Gets existing image paths for an article
   */
  getExistingImages(articleId: string): string[] {
    const dir = this.getArticleImageDir(articleId);
    if (!fs.existsSync(dir)) return [];

    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map((f) => path.join(dir, f));
  }
}

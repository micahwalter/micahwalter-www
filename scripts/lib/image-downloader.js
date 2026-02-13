/**
 * Image Downloader
 * Downloads images from WordPress with retry logic and rate limiting
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const pLimitModule = require('p-limit');
const pLimit = pLimitModule.default || pLimitModule;

class ImageDownloader {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.timeout = options.timeout || 30000;
    this.limit = pLimit(this.maxConcurrent);
  }

  /**
   * Download multiple images with concurrency control
   * @param {Array<Object>} images - Array of {url, destPath} objects
   * @param {Function} progressCallback - Called with progress updates
   * @returns {Promise<Object>} Results object with success/failure counts
   */
  async downloadImages(images, progressCallback = null) {
    const results = {
      total: images.length,
      succeeded: 0,
      failed: 0,
      failures: []
    };

    const tasks = images.map((img, index) =>
      this.limit(async () => {
        try {
          await this.downloadImage(img.url, img.destPath);
          results.succeeded++;

          if (progressCallback) {
            progressCallback({
              index: index + 1,
              total: images.length,
              url: img.url,
              status: 'success'
            });
          }
        } catch (error) {
          results.failed++;
          results.failures.push({
            url: img.url,
            destPath: img.destPath,
            error: error.message
          });

          if (progressCallback) {
            progressCallback({
              index: index + 1,
              total: images.length,
              url: img.url,
              status: 'failed',
              error: error.message
            });
          }
        }
      })
    );

    await Promise.all(tasks);
    return results;
  }

  /**
   * Download a single image with retry logic
   * @param {string} url - Image URL
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  async downloadImage(url, destPath) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this._downloadAttempt(url, destPath);
        return; // Success
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          // Wait before retrying
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Single download attempt
   * @param {string} url - Image URL
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  _downloadAttempt(url, destPath) {
    return new Promise((resolve, reject) => {
      // Ensure destination directory exists
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);

      const request = protocol.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NextJSMigration/1.0)'
        }
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(destPath);

          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            return reject(new Error('Redirect without location header'));
          }

          // Follow redirect
          this._downloadAttempt(redirectUrl, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            // Verify file was written
            const stats = fs.statSync(destPath);
            if (stats.size === 0) {
              fs.unlinkSync(destPath);
              return reject(new Error('Downloaded file is empty'));
            }
            resolve();
          });
        });

        file.on('error', (err) => {
          file.close();
          fs.unlinkSync(destPath);
          reject(err);
        });
      });

      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        reject(err);
      });

      request.on('timeout', () => {
        request.destroy();
        file.close();
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Generate local filename from WordPress URL
   * @param {string} url - WordPress image URL
   * @returns {string} Local filename
   */
  getLocalFilename(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract filename from path
    let filename = path.basename(pathname);

    // WordPress sometimes adds size suffixes like -300x200.jpg
    // Remove these to get the original filename
    filename = filename.replace(/-\d+x\d+(\.[^.]+)$/, '$1');

    // Sanitize filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');

    return filename;
  }

  /**
   * Check if URL is a WordPress media URL
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isWordPressMedia(url) {
    return url.includes('/wp-content/uploads/');
  }

  /**
   * Sleep helper
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ImageDownloader;

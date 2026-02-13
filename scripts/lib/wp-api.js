/**
 * WordPress REST API Client
 * Fetches posts, categories, tags, and media from WordPress site
 */

const WP_BASE_URL = 'https://micahwalter.com/wp-json/wp/v2';

class WordPressAPI {
  constructor() {
    this.baseUrl = WP_BASE_URL;
  }

  /**
   * Fetch all posts with pagination
   * @returns {Promise<Array>} All posts from WordPress
   */
  async fetchAllPosts() {
    const posts = [];
    let page = 1;
    let hasMore = true;

    console.log('Fetching posts from WordPress...');

    while (hasMore) {
      try {
        const url = `${this.baseUrl}/posts?page=${page}&per_page=10&_embed`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 400 && page > 1) {
            // No more pages
            hasMore = false;
            break;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.length === 0) {
          hasMore = false;
        } else {
          posts.push(...data);
          console.log(`  Fetched page ${page} (${data.length} posts)`);
          page++;
        }

        // Rate limiting - be nice to the WordPress server
        await this.sleep(500);
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);

        // Retry logic
        if (error.message.includes('HTTP')) {
          console.log('  Retrying in 2 seconds...');
          await this.sleep(2000);
          continue;
        }

        throw error;
      }
    }

    console.log(`Total posts fetched: ${posts.length}`);
    return posts;
  }

  /**
   * Fetch all categories
   * @returns {Promise<Object>} Map of category ID to category object
   */
  async fetchCategories() {
    console.log('Fetching categories...');
    const categories = {};
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}/categories?page=${page}&per_page=100`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400 && page > 1) {
          hasMore = false;
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(cat => {
          categories[cat.id] = {
            id: cat.id,
            name: cat.name,
            slug: cat.slug
          };
        });
        page++;
      }

      await this.sleep(300);
    }

    console.log(`  Found ${Object.keys(categories).length} categories`);
    return categories;
  }

  /**
   * Fetch all tags
   * @returns {Promise<Object>} Map of tag ID to tag object
   */
  async fetchTags() {
    console.log('Fetching tags...');
    const tags = {};
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}/tags?page=${page}&per_page=100`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400 && page > 1) {
          hasMore = false;
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(tag => {
          tags[tag.id] = {
            id: tag.id,
            name: tag.name,
            slug: tag.slug
          };
        });
        page++;
      }

      await this.sleep(300);
    }

    console.log(`  Found ${Object.keys(tags).length} tags`);
    return tags;
  }

  /**
   * Fetch featured image URL for a post
   * @param {Object} post - WordPress post object with _embedded data
   * @returns {string|null} Featured image URL or null
   */
  getFeaturedImageUrl(post) {
    try {
      if (post._embedded && post._embedded['wp:featuredmedia']) {
        const media = post._embedded['wp:featuredmedia'][0];
        return media.source_url || null;
      }
    } catch (error) {
      // No featured image
    }
    return null;
  }

  /**
   * Extract category names from post
   * @param {Object} post - WordPress post object
   * @param {Object} categoriesMap - Map of category IDs to category objects
   * @returns {Array<string>} Category names
   */
  getPostCategories(post, categoriesMap) {
    if (!post.categories || post.categories.length === 0) {
      return [];
    }
    return post.categories
      .map(id => categoriesMap[id]?.name)
      .filter(Boolean);
  }

  /**
   * Extract tag names from post
   * @param {Object} post - WordPress post object
   * @param {Object} tagsMap - Map of tag IDs to tag objects
   * @returns {Array<string>} Tag names
   */
  getPostTags(post, tagsMap) {
    if (!post.tags || post.tags.length === 0) {
      return [];
    }
    return post.tags
      .map(id => tagsMap[id]?.name)
      .filter(Boolean);
  }

  /**
   * Sleep helper for rate limiting
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WordPressAPI;

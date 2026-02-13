/**
 * Post Writer
 * Creates post directories and writes MDX files with frontmatter
 */

const fs = require('fs');
const path = require('path');

class PostWriter {
  constructor(contentDir = 'content/posts') {
    this.contentDir = contentDir;
  }

  /**
   * Write a post to disk
   * @param {Object} post - Post data object
   * @returns {Object} Result with success status and path
   */
  writePost(post) {
    const { slug, date, frontmatter, content } = post;

    // Create post directory
    const postDir = this.getPostDirectory(slug, date);

    try {
      // Ensure directory exists
      if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir, { recursive: true });
      }

      // Write index.mdx
      const mdxPath = path.join(postDir, 'index.mdx');
      const fullContent = this.generateMDXContent(frontmatter, content);

      fs.writeFileSync(mdxPath, fullContent, 'utf-8');

      return {
        success: true,
        path: mdxPath,
        directory: postDir
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: null,
        directory: postDir
      };
    }
  }

  /**
   * Get post directory path
   * @param {string} slug - Post slug
   * @param {string} date - Publication date (YYYY-MM-DD)
   * @returns {string} Full directory path
   */
  getPostDirectory(slug, date) {
    const dirname = `${date}-${slug}`;
    return path.join(process.cwd(), this.contentDir, dirname);
  }

  /**
   * Check if slug already exists and resolve conflicts
   * @param {string} slug - Post slug
   * @param {string} date - Publication date
   * @returns {string} Available slug (may have -2, -3 suffix)
   */
  resolveSlugConflict(slug, date) {
    let testSlug = slug;
    let counter = 2;

    while (fs.existsSync(this.getPostDirectory(testSlug, date))) {
      testSlug = `${slug}-${counter}`;
      counter++;
    }

    if (testSlug !== slug) {
      console.warn(`  Warning: Slug conflict for "${slug}", using "${testSlug}" instead`);
    }

    return testSlug;
  }

  /**
   * Generate complete MDX content with frontmatter
   * @param {Object} frontmatter - Frontmatter object
   * @param {string} content - MDX content
   * @returns {string} Complete MDX file content
   */
  generateMDXContent(frontmatter, content) {
    const yaml = this.frontmatterToYAML(frontmatter);
    return `---\n${yaml}---\n\n${content}`;
  }

  /**
   * Convert frontmatter object to YAML string
   * @param {Object} frontmatter - Frontmatter object
   * @returns {string} YAML string
   */
  frontmatterToYAML(frontmatter) {
    const lines = [];

    // Required fields first
    if (frontmatter.title) {
      lines.push(`title: "${this.escapeYAML(frontmatter.title)}"`);
    }

    if (frontmatter.publishedAt) {
      lines.push(`publishedAt: "${frontmatter.publishedAt}"`);
    }

    if (frontmatter.excerpt) {
      lines.push(`excerpt: "${this.escapeYAML(frontmatter.excerpt)}"`);
    }

    if (frontmatter.category) {
      lines.push(`category: "${frontmatter.category}"`);
    }

    // Optional fields
    if (frontmatter.coverImage) {
      lines.push(`coverImage: "${frontmatter.coverImage}"`);
    }

    if (frontmatter.tags && frontmatter.tags.length > 0) {
      lines.push('tags:');
      frontmatter.tags.forEach(tag => {
        lines.push(`  - "${this.escapeYAML(tag)}"`);
      });
    }

    if (frontmatter.draft !== undefined) {
      lines.push(`draft: ${frontmatter.draft}`);
    }

    // Add WordPress-specific metadata as comments for reference
    if (frontmatter.wpId) {
      lines.push(`# WordPress ID: ${frontmatter.wpId}`);
    }

    if (frontmatter.wpUrl) {
      lines.push(`# Original URL: ${frontmatter.wpUrl}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Escape special characters in YAML strings
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeYAML(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }

  /**
   * Map WordPress category to new site category
   * @param {Array<string>} wpCategories - WordPress category names
   * @returns {string} Primary category for new site
   */
  mapCategory(wpCategories) {
    if (!wpCategories || wpCategories.length === 0) {
      return 'Writing'; // Default category
    }

    // Category priority mapping (case-insensitive)
    const categoryMap = {
      'ai': 'AI',
      'artificial intelligence': 'AI',
      'machine learning': 'AI',
      'aws': 'AWS',
      'amazon web services': 'AWS',
      'cloud': 'AWS',
      'writing': 'Writing',
      'go': 'Writing', // Map Go lang to Writing for now
      'golang': 'Writing',
      'python': 'Writing',
      'javascript': 'Writing',
      'technology': 'Writing',
      'research': 'Writing',
      'uncategorized': 'Writing'
    };

    // Try to find a mapped category
    for (const wpCat of wpCategories) {
      const normalized = wpCat.toLowerCase();
      if (categoryMap[normalized]) {
        return categoryMap[normalized];
      }
    }

    // If no match, use first category or default
    return wpCategories[0] || 'Writing';
  }

  /**
   * Parse WordPress date to YYYY-MM-DD format
   * @param {string} wpDate - WordPress date string
   * @returns {string} Date in YYYY-MM-DD format
   */
  parseDate(wpDate) {
    const date = new Date(wpDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate slug from WordPress slug or title
   * @param {string} wpSlug - WordPress slug
   * @returns {string} Cleaned slug
   */
  generateSlug(wpSlug) {
    return wpSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Validate frontmatter has required fields
   * @param {Object} frontmatter - Frontmatter object
   * @returns {Object} Validation result
   */
  validateFrontmatter(frontmatter) {
    const required = ['title', 'publishedAt', 'excerpt', 'category'];
    const missing = required.filter(field => !frontmatter[field]);

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

module.exports = PostWriter;

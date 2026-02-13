/**
 * HTML to MDX Converter
 * Converts WordPress HTML content to clean MDX using Turndown
 */

const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

class HTMLToMDXConverter {
  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '_',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      bulletListMarker: '-',
    });

    // Add GitHub Flavored Markdown support (tables, strikethrough, etc.)
    this.turndownService.use(gfm);

    // Custom rules for WordPress-specific elements
    this.addCustomRules();
  }

  /**
   * Add custom Turndown rules for WordPress content
   */
  addCustomRules() {
    // Handle WordPress code blocks with language classes
    this.turndownService.addRule('codeBlocks', {
      filter: (node) => {
        return (
          node.nodeName === 'PRE' &&
          node.firstChild &&
          node.firstChild.nodeName === 'CODE'
        );
      },
      replacement: (content, node) => {
        const code = node.firstChild;
        const language = this.extractLanguage(code);
        const codeContent = code.textContent || '';

        return '\n\n```' + language + '\n' + codeContent + '\n```\n\n';
      }
    });

    // Handle WordPress figures with captions
    this.turndownService.addRule('figures', {
      filter: 'figure',
      replacement: (content, node) => {
        const img = node.querySelector('img');
        const caption = node.querySelector('figcaption');

        if (!img) return content;

        const imgSrc = img.getAttribute('src') || '';
        const imgAlt = img.getAttribute('alt') || '';
        let result = `\n\n![${imgAlt}](${imgSrc})\n`;

        if (caption && caption.textContent) {
          result += `_${caption.textContent.trim()}_\n`;
        }

        return result + '\n';
      }
    });

    // Handle WordPress image blocks
    this.turndownService.addRule('wpImages', {
      filter: (node) => {
        return node.nodeName === 'IMG' && node.className && node.className.includes('wp-');
      },
      replacement: (content, node) => {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        return `\n![${alt}](${src})\n`;
      }
    });

    // Remove WordPress shortcodes that can't be converted
    this.turndownService.addRule('shortcodes', {
      filter: (node) => {
        if (node.nodeName === '#text') {
          return /\[.*?\]/.test(node.textContent);
        }
        return false;
      },
      replacement: (content) => {
        // Strip shortcodes, they won't work in MDX
        return content.replace(/\[.*?\]/g, '');
      }
    });
  }

  /**
   * Extract language from code block class names
   * @param {Element} codeElement - Code element
   * @returns {string} Language identifier
   */
  extractLanguage(codeElement) {
    const className = codeElement.className || '';

    // WordPress uses class="language-python" or class="wp-block-code language-python"
    const match = className.match(/language-(\w+)/);
    if (match) {
      return match[1];
    }

    // Some WordPress themes use class="python" or class="brush: python"
    const brushMatch = className.match(/brush:\s*(\w+)/);
    if (brushMatch) {
      return brushMatch[1];
    }

    // Check for common language classes
    const languages = ['javascript', 'python', 'java', 'go', 'rust', 'bash', 'shell', 'sql', 'html', 'css', 'json', 'yaml', 'xml'];
    for (const lang of languages) {
      if (className.includes(lang)) {
        return lang;
      }
    }

    return '';
  }

  /**
   * Decode HTML entities
   * @param {string} text - Text with HTML entities
   * @returns {string} Decoded text
   */
  decodeHTMLEntities(text) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&apos;': "'",
      '&#8217;': "'",
      '&#8216;': "'",
      '&#8220;': '"',
      '&#8221;': '"',
      '&#8211;': '–',
      '&#8212;': '—',
      '&nbsp;': ' ',
      '&hellip;': '...',
    };

    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
  }

  /**
   * Convert WordPress HTML to MDX
   * @param {string} html - WordPress HTML content
   * @returns {string} MDX content
   */
  convert(html) {
    if (!html) return '';

    // Decode HTML entities first
    html = this.decodeHTMLEntities(html);

    // Clean up WordPress-specific HTML before conversion
    let cleanedHtml = html;

    // Remove WordPress gallery shortcodes (can't be converted easily)
    cleanedHtml = cleanedHtml.replace(/\[gallery[^\]]*\]/g, '');

    // Remove WordPress caption shortcodes (already handled by figure rule)
    cleanedHtml = cleanedHtml.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, '$1');

    // Convert to markdown
    let markdown = this.turndownService.turndown(cleanedHtml);

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    markdown = markdown.trim();

    return markdown;
  }

  /**
   * Extract all image URLs from HTML content
   * @param {string} html - WordPress HTML content
   * @returns {Array<string>} Array of image URLs
   */
  extractImageUrls(html) {
    if (!html) return [];

    const urls = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      urls.push(match[1]);
    }

    // Also check for images in figure elements
    const figureRegex = /<figure[^>]*>.*?<img[^>]+src="([^">]+)".*?<\/figure>/gs;
    while ((match = figureRegex.exec(html)) !== null) {
      if (!urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }

    return urls;
  }

  /**
   * Replace WordPress image URLs with local paths in MDX
   * @param {string} mdx - MDX content
   * @param {Object} urlMap - Map of WordPress URL to local filename
   * @returns {string} Updated MDX with local image paths
   */
  replaceImageUrls(mdx, urlMap) {
    let updated = mdx;

    for (const [wpUrl, localPath] of Object.entries(urlMap)) {
      // Replace in markdown image syntax: ![alt](url)
      updated = updated.replace(
        new RegExp(`\\!\\[([^\\]]*)\\]\\(${this.escapeRegex(wpUrl)}\\)`, 'g'),
        `![$1](./${localPath})`
      );

      // Replace in plain URLs (in case some weren't converted)
      updated = updated.replace(
        new RegExp(this.escapeRegex(wpUrl), 'g'),
        `./${localPath}`
      );
    }

    return updated;
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate excerpt from content
   * @param {string} content - Post content (HTML or MDX)
   * @param {number} maxLength - Maximum length
   * @returns {string} Excerpt
   */
  generateExcerpt(content, maxLength = 160) {
    // Decode HTML entities
    content = this.decodeHTMLEntities(content);

    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ');

    // Strip markdown syntax
    const plainText = text
      .replace(/[#*`[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    // Truncate at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }
}

module.exports = HTMLToMDXConverter;

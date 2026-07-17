#!/usr/bin/env node

/**
 * Blog CLI - Unified management tool for blog operations
 *
 * Commands:
 *   images:optimize    - Process images into multiple sizes/formats
 *   images:upload      - Upload both original and processed images to S3
 *   images:download    - Download images from S3 to local
 *   images:sync        - Smart sync between local and S3
 *   images:copy-local  - Copy optimized images to public/ for dev
 *   build              - Optimize images and copy to public/ (local dev)
 *   build:static       - Generate static files (RSS, sitemap, posts.json)
 *   email:send         - Render an email post and emit NewsletterSendRequested
 *   help               - Show help information
 */

const { execSync } = require('child_process');
const path = require('path');

const commands = {
  'post:new': {
    description: 'Create a new blog post with frontmatter template',
    script: 'scripts/create-post.js',
    examples: [
      'blog post:new',
      'blog post:new "My Post Title"'
    ]
  },
  'photos:import': {
    description: 'Import photos into DynamoDB (stages image for S3 sync; no index.md)',
    script: 'scripts/import-photos.js',
    examples: [
      'blog photos:import ~/Desktop/photos',
      'blog photos:import ./photos --dry-run',
      'blog photos:import ~/trips --category Travel',
      'blog photos:import ./photos --featured'
    ]
  },
  'photos:tag': {
    description: 'AI-tag DynamoDB photos via Bedrock Vision',
    script: 'scripts/tag-photos.js',
    examples: [
      'blog photos:tag 157 --profile www',
      'blog photos:tag --all --auto-approve --profile www',
      'blog photos:tag 2026-02-16-sunset-park --profile www'
    ]
  },
  'photos:update-exif': {
    description: 'Extract EXIF metadata from an existing photo post and update its frontmatter',
    script: 'scripts/update-photo-exif.js',
    examples: [
      'blog photos:update-exif 2026-02-16-photo-img-0803',
      'blog photos:update-exif 2026-02-16-photo-img-0803 --dry-run'
    ]
  },
  'images:optimize': {
    description: 'Process images into multiple sizes and formats',
    script: 'scripts/optimize-images.js',
    examples: [
      'blog images:optimize'
    ]
  },
  'images:upload': {
    description: 'Upload both original and processed images to S3',
    script: 'scripts/upload-images.js',
    examples: [
      'blog images:upload',
      'blog images:upload --dry-run',
      'blog images:upload --profile www'
    ]
  },
  'images:download': {
    description: 'Download images from S3 to local directories',
    script: 'scripts/download-images.js',
    examples: [
      'blog images:download',
      'blog images:download --originals-only',
      'blog images:download --processed-only'
    ]
  },
  'images:sync': {
    description: 'Smart sync: optimize locally, upload all to S3',
    script: 'scripts/sync-images.js',
    examples: [
      'blog images:sync',
      'blog images:sync --profile www'
    ]
  },
  'images:copy-local': {
    description: 'Copy optimized images to public/ for local development',
    script: 'scripts/copy-images-local.js',
    examples: [
      'blog images:copy-local'
    ]
  },
  'build': {
    description: 'Optimize images and copy to public/ for local development',
    examples: [
      'blog build'
    ]
  },
  'build:static': {
    description: 'Generate static files (RSS, sitemap, posts.json)',
    examples: [
      'blog build:static'
    ]
  },
  'email:send': {
    description: 'Render an email post and emit NewsletterSendRequested to trigger dispatch',
    script: 'scripts/email-send.js',
    examples: [
      'blog email:send march-2026',
      'blog email:send march-2026 --dry-run',
      'blog email:send march-2026 --profile www',
      'blog email:send march-2026 --test you@example.com --profile www'
    ]
  },
  'help': {
    description: 'Show this help message'
  }
};

function showHelp(commandName) {
  if (commandName && commands[commandName]) {
    const cmd = commands[commandName];
    console.log(`\n📖 ${commandName}`);
    console.log(`   ${cmd.description}\n`);

    if (cmd.examples && cmd.examples.length > 0) {
      console.log('Examples:');
      cmd.examples.forEach(ex => console.log(`   ${ex}`));
      console.log('');
    }
    return;
  }

  console.log('\n📝 Blog CLI - Management tool for your blog\n');
  console.log('Usage:');
  console.log('   blog <command> [options]\n');
  console.log('Commands:\n');

  Object.entries(commands).forEach(([name, cmd]) => {
    console.log(`   ${name.padEnd(20)} ${cmd.description}`);
  });

  console.log('\nFor detailed help on a command:');
  console.log('   blog help <command>\n');
}

function runCommand(commandName, args) {
  const cmd = commands[commandName];

  if (!cmd) {
    console.error(`\n❌ Unknown command: ${commandName}\n`);
    showHelp();
    process.exit(1);
  }

  if (commandName === 'help') {
    showHelp(args[0]);
    return;
  }

  if (commandName === 'build') {
    // Run image optimization and copy to public
    const scripts = [
      'scripts/optimize-images.js',
      'scripts/copy-images-local.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(__dirname, '..', script);
      console.log(`\n🔨 Running ${path.basename(script)}...`);
      execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    }
    return;
  }

  if (commandName === 'build:static') {
    // Run all prebuild scripts
    const scripts = [
      'scripts/generate-posts-json.js',
      'scripts/generate-rss.js',
      'scripts/generate-sitemap.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(__dirname, '..', script);
      console.log(`\n🔨 Running ${path.basename(script)}...`);
      execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    }
    return;
  }

  if (!cmd.script) {
    console.error(`\n❌ No script defined for: ${commandName}\n`);
    process.exit(1);
  }

  const scriptPath = path.join(__dirname, '..', cmd.script);

  // Properly quote arguments that contain spaces
  const quotedArgs = args.map(arg => {
    if (arg.includes(' ') || arg.includes('"')) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  }).join(' ');

  try {
    execSync(`node "${scriptPath}" ${quotedArgs}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  runCommand(commandName, commandArgs);
}

main();

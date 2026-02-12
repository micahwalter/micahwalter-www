const fs = require('fs');
const path = require('path');

const postsDir = path.join(process.cwd(), 'content/posts');
const publicImagesDir = path.join(process.cwd(), 'public/images/posts');

// Create public/images/posts directory if it doesn't exist
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// Get all post folders
const postFolders = fs.readdirSync(postsDir).filter(folder => {
  const fullPath = path.join(postsDir, folder);
  return fs.statSync(fullPath).isDirectory();
});

// Copy images from each post folder
postFolders.forEach(folder => {
  const postDir = path.join(postsDir, folder);
  const files = fs.readdirSync(postDir);

  // Find image files (jpg, jpeg, png, gif, webp)
  const imageFiles = files.filter(file =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );

  imageFiles.forEach(imageFile => {
    const sourcePath = path.join(postDir, imageFile);
    const destPath = path.join(publicImagesDir, `${folder}-${imageFile}`);

    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${folder}/${imageFile} to public/images/posts/`);
  });
});

console.log(`✓ Copied images from ${postFolders.length} posts`);

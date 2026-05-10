// fix-import-paths.js
// Fix wrong import paths in component subdirectories

import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

// Find all JS/JSX/TS/TSX files
function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, extensions));
    } else if (extensions.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Calculate correct import path prefix based on file depth
function getCorrectPrefix(filePath) {
  const relativePath = path.relative(componentsDir, filePath);
  const depth = relativePath.split(path.sep).length - 1;
  
  if (depth === 1) {
    // File is in src/components/ directly
    return '../lib/';
  } else if (depth === 2) {
    // File is in src/components/subdir/
    return '../../lib/';
  } else if (depth === 3) {
    // File is in src/components/subdir/subdir/
    return '../../../lib/';
  }
  return '../lib/'; // fallback
}

// Fix imports in a file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const correctPrefix = getCorrectPrefix(filePath);
  
  // Match import statements trying to import from ../lib/ when they should use correctPrefix
  const importRegex = /from\s+['"](\.\.\/lib\/[^'"]+)['"]/g;
  
  let match;
  let modified = false;
  let newContent = content;
  
  while ((match = importRegex.exec(content)) !== null) {
    const oldImport = match[1];
    const expectedPath = correctPrefix + oldImport.replace(/^\.\.\/lib\//, '');
    
    // Check if the path is wrong
    const expectedDepth = correctPrefix === '../lib/' ? 1 : correctPrefix === '../../lib/' ? 2 : 3;
    const actualDepth = (oldImport.match(/\.\.\//g) || []).length;
    
    if (actualDepth !== expectedDepth) {
      newContent = newContent.replace(
        `from '${oldImport}'`,
        `from '${expectedPath}'`
      );
      newContent = newContent.replace(
        `from "${oldImport}"`,
        `from "${expectedPath}"`
      );
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

// Main
const files = findFiles(componentsDir);
let fixedCount = 0;

for (const file of files) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount} files.`);

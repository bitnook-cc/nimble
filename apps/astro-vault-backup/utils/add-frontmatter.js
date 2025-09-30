#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function addFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has frontmatter
  if (content.startsWith('---')) {
    return;
  }
  
  // Extract title from first line or filename
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim();
  const fileName = path.basename(filePath, '.md');
  
  // Use first line as title if it looks like a heading, otherwise use filename
  const title = firstLine && !firstLine.startsWith('-') && !firstLine.startsWith('*') 
    ? firstLine.replace(/^#+\s*/, '') // Remove markdown heading syntax
    : fileName;
  
  const frontmatter = `---
title: ${title}
---

`;
  
  // If the first line was used as title and it's not a markdown heading, make it a heading
  let newContent;
  if (firstLine && firstLine === title) {
    newContent = frontmatter + `# ${title}\n\n` + lines.slice(1).join('\n');
  } else {
    newContent = frontmatter + content;
  }
  
  fs.writeFileSync(filePath, newContent);
  console.log(`Added frontmatter to: ${filePath}`);
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
      addFrontmatter(fullPath);
    }
  }
}

// Start processing from docs directory
processDirectory('./src/content/docs');
console.log('Finished adding frontmatter to all markdown files');
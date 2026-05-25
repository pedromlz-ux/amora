const fs = require('fs');

const files = ['index.html', 'configuracao.html', 'aulas.html'];
const pageNames = { 'index.html': 'page', 'configuracao.html': 'configuracao/page', 'aulas.html': 'aulas/page' };

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) continue;
  let bodyContent = bodyMatch[1];
  
  // Basic JSX conversions
  bodyContent = bodyContent.replace(/class=/g, 'className=');
  bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
  bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
  
  // Fix void elements (input, img, hr, br)
  bodyContent = bodyContent.replace(/<(img|input|hr|br|meta|link)([^>]*?)(?<!\/)>/g, '<$1$2 />');
  
  // Fix inline styles (very basic, might break if there are complex inline styles, but Tailwind usually avoids them)
  bodyContent = bodyContent.replace(/style="([^"]*)"/g, (match, p1) => {
    // If it's empty, just remove it
    if (!p1.trim()) return '';
    // If it's a variable assignment like style="--tw-bg-opacity: 1;" we can't easily parse it.
    // For this simple migration, we'll just remove complex styles or replace with generic object
    return `style={{}}`; 
  });
  
  // Also we need to wrap the raw JS inside <script> into a useEffect
  // Let's extract script tags
  let scripts = [];
  bodyContent = bodyContent.replace(/<script>([\s\S]*?)<\/script>/gi, (match, p1) => {
    scripts.push(p1);
    return '';
  });

  const tsxContent = `
'use client';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    // Execute legacy scripts
    ${scripts.join('\n')}
  }, []);

  return (
    <>
      ${bodyContent}
    </>
  );
}
`;
  const outPath = `app/${pageNames[file]}.tsx`;
  const dir = outPath.split('/').slice(0, -1).join('/');
  if (dir !== 'app') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, tsxContent);
  console.log(`Converted ${file} to ${outPath}`);
}

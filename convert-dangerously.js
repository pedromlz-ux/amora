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
  
  // Extract scripts
  let scripts = [];
  bodyContent = bodyContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, p1) => {
    scripts.push(p1);
    return ''; // Remove script from HTML
  });

  // Escape backticks and dollars for template literal
  const escapedHtml = bodyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const tsxContent = `
'use client';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    // Execute legacy scripts
    try {
      ${scripts.join('\n')}
    } catch(e) {
      console.error(e);
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: \`${escapedHtml}\` }} />
  );
}
`;
  const outPath = `app/${pageNames[file]}.tsx`;
  const dir = outPath.split('/').slice(0, -1).join('/');
  if (dir !== 'app') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, tsxContent);
  console.log(`Converted ${file} using dangerouslySetInnerHTML`);
}

const fs = require('fs');
const path = require('path');

// Wykryj środowisko
const isCloudflarePages = process.env.CF_PAGES === '1';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// Określ basePath
const BASE_PATH = (isProduction && isGitHubActions && !isCloudflarePages) 
  ? '/myvillagebus-web' 
  : '';

const templatePath = path.join(__dirname, '../public/manifest.template.json');
const outputPath = path.join(__dirname, '../public/manifest.json');

console.log('📝 Generowanie manifest.json...');
console.log('   Środowisko:', {
  CF_PAGES: isCloudflarePages,
  GITHUB_ACTIONS: isGitHubActions,
  NODE_ENV: process.env.NODE_ENV,
  BASE_PATH: BASE_PATH || '(brak)'
});

if (!fs.existsSync(templatePath)) {
  console.error('❌ Nie znaleziono public/manifest.template.json');
  process.exit(1);
}

let template = fs.readFileSync(templatePath, 'utf-8');
const manifest = template.replace(/\{\{BASE_PATH\}\}/g, BASE_PATH);

fs.writeFileSync(outputPath, manifest, 'utf-8');
console.log('✅ Wygenerowano manifest.json z basePath:', BASE_PATH || '(brak)');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../public/manifest.template.json');
const outputPath = path.join(__dirname, '../public/manifest.json');

console.log('📝 Generowanie manifest.json...');

if (!fs.existsSync(templatePath)) {
  console.error('❌ Nie znaleziono public/manifest.template.json');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');
const manifest = JSON.parse(template);

// Usuń placeholder {{BASE_PATH}} jeśli pozostał
manifest.start_url = manifest.start_url.replace('{{BASE_PATH}}', '');
manifest.scope = manifest.scope.replace('{{BASE_PATH}}', '');

// Upewnij się że start_url to /app
if (manifest.start_url === '/' || manifest.start_url === '') {
  manifest.start_url = '/app';
}

fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log('✅ Wygenerowano manifest.json z start_url:', manifest.start_url);
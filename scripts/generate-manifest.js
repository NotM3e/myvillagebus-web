const fs = require('fs');
const path = require('path');

const BASE_PATH = '/myvillagebus-web';

// Wczytaj szablon
const templatePath = path.join(__dirname, '../public/manifest.template.json');
const outputPath = path.join(__dirname, '../public/manifest.json');

console.log('📝 Generowanie manifest.json...');

// Sprawdź czy szablon istnieje
if (!fs.existsSync(templatePath)) {
  console.error('❌ Nie znaleziono public/manifest.template.json');
  process.exit(1);
}

// Wczytaj szablon
let template = fs.readFileSync(templatePath, 'utf-8');

// Zamień placeholder na basePath
const manifest = template.replace(/\{\{BASE_PATH\}\}/g, BASE_PATH);

// Zapisz
fs.writeFileSync(outputPath, manifest, 'utf-8');

console.log('✅ Wygenerowano public/manifest.json z basePath:', BASE_PATH);
import { readFileSync } from 'fs';

const extracted = JSON.parse(readFileSync('./scripts/extracted_all_data.json', 'utf8'));
const transFile = readFileSync('../client/src/utils/translations.js', 'utf8');

// Parse keys in translations for hi, mr, kn
const getKeys = (lang) => {
  const match = transFile.match(new RegExp(`${lang}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
  if (!match) return new Set();
  const inner = match[1];
  const keys = new Set();
  const kRegex = /(?:^|\n)\s*(?:"([^"]+)"|([a-zA-Z0-9_]+))\s*:/g;
  let m;
  while ((m = kRegex.exec(inner)) !== null) {
    keys.add((m[1] || m[2]).trim());
  }
  return keys;
};

const hiKeys = getKeys('hi');
const mrKeys = getKeys('mr');
const knKeys = getKeys('kn');

const missingHi = extracted.keys.filter(k => !hiKeys.has(k) && !hiKeys.has(k.toLowerCase()) && !hiKeys.has(k.trim()));
console.log('Missing category/service keys in Hindi:', missingHi.length);
console.log(JSON.stringify(missingHi, null, 2));

const missingDesc = extracted.descriptions.filter(d => !hiKeys.has(d));
console.log('\nMissing descriptions in Hindi:', missingDesc.length);
console.log(JSON.stringify(missingDesc.slice(0, 30), null, 2));

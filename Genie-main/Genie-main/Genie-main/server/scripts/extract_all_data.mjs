import { readFileSync, writeFileSync } from 'fs';

const c = readFileSync('./data/servicesDetailsData.js', 'utf8');

// Extract all keys
const keys = [];
// Match object keys in servicesDetailsData
const keyRegex = /"([^"\\]+)":\s*\{/g;
let m;
while ((m = keyRegex.exec(c)) !== null) {
  keys.push(m[1].trim());
}

// Match name: "..."
const nameRegex = /name:\s*"([^"]+)"/g;
while ((m = nameRegex.exec(c)) !== null) {
  keys.push(m[1].trim());
}

// Match title: "..."
const titleRegex = /title:\s*"([^"]+)"/g;
while ((m = titleRegex.exec(c)) !== null) {
  keys.push(m[1].trim());
}

// Match description strings
const descRegex = /description:\s*\[([\s\S]*?)\]/g;
const descriptions = [];
while ((m = descRegex.exec(c)) !== null) {
  const inner = m[1];
  const strRegex = /"([^"]+)"/g;
  let sm;
  while ((sm = strRegex.exec(inner)) !== null) {
    descriptions.push(sm[1].trim());
  }
}

// Also single string description: description: "..."
const singleDescRegex = /description:\s*"([^"]+)"/g;
while ((m = singleDescRegex.exec(c)) !== null) {
  descriptions.push(m[1].trim());
}

const uniqueKeys = [...new Set(keys)].sort();
const uniqueDescriptions = [...new Set(descriptions)].sort();

writeFileSync('./scripts/extracted_all_data.json', JSON.stringify({
  keys: uniqueKeys,
  descriptions: uniqueDescriptions
}, null, 2));

console.log('Extracted keys count:', uniqueKeys.length);
console.log('Extracted descriptions count:', uniqueDescriptions.length);

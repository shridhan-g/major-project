import { readFileSync, writeFileSync } from 'fs';

const c = readFileSync('./data/servicesDetailsData.js', 'utf8');
const m = [...c.matchAll(/title:\s*"([^"]+)"/g)];
const titles = [...new Set(m.map(x => x[1]))].sort();
console.log('Total unique titles:', titles.length);
writeFileSync('./scripts/all_titles.json', JSON.stringify(titles, null, 2));
console.log('Written to scripts/all_titles.json');

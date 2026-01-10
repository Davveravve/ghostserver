const fs = require('fs');
const path = require('path');

// Read the doppler data
const dopplerData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'doppler_data.json'), 'utf8'));

const allKeys = Object.keys(dopplerData);

// Find all Doppler phase items (excluding StatTrak for simplicity)
const dopplerKeys = allKeys.filter(key => {
  return key.includes('Doppler') &&
    !key.includes('StatTrak') && // Skip StatTrak for now
    (
      key.includes('Ruby') ||
      key.includes('Sapphire') ||
      key.includes('Black Pearl') ||
      key.includes('Emerald') ||
      key.includes('Phase 1') ||
      key.includes('Phase 2') ||
      key.includes('Phase 3') ||
      key.includes('Phase 4')
    );
});

console.log('Found Doppler phase items (non-StatTrak):', dopplerKeys.length);

// Map exterior to wear code
function getWear(exterior) {
  switch (exterior) {
    case 'Factory New': return 'FN';
    case 'Minimal Wear': return 'MW';
    case 'Field-Tested': return 'FT';
    case 'Well-Worn': return 'WW';
    case 'Battle-Scarred': return 'BS';
    default: return 'FN';
  }
}

// Get phase from key
function getPhase(key) {
  if (key.includes('Ruby')) return 'Ruby';
  if (key.includes('Sapphire')) return 'Sapphire';
  if (key.includes('Black Pearl')) return 'Black Pearl';
  if (key.includes('Emerald')) return 'Emerald';
  if (key.includes('Phase 1')) return 'Phase 1';
  if (key.includes('Phase 2')) return 'Phase 2';
  if (key.includes('Phase 3')) return 'Phase 3';
  if (key.includes('Phase 4')) return 'Phase 4';
  return null;
}

// Generate items
const dopplerItems = [];
let id = 100000; // Start from high ID to avoid conflicts

dopplerKeys.forEach(key => {
  const item = dopplerData[key];
  const phase = getPhase(key);
  const wear = getWear(item.exterior);

  // Clean weapon name (remove star symbol)
  const weaponName = item.weapon || key.split('|')[0].replace('★', '').trim();

  // Create skin name with phase
  let skinName = 'Doppler';
  if (phase && phase !== 'Phase 1' && phase !== 'Phase 2' && phase !== 'Phase 3' && phase !== 'Phase 4') {
    skinName = `Doppler ${phase}`;
  } else if (phase) {
    skinName = `Doppler ${phase}`;
  }

  // Get float caps
  const floatCaps = item['float-caps'] || [0, 0.08];

  dopplerItems.push({
    id: id++,
    name: skinName,
    type: 'knife',
    weapon: weaponName,
    wear: wear,
    min_float: floatCaps[0],
    max_float: floatCaps[1],
    image_url: item.image,
    is_tradeable: true,
    doppler_phase: phase
  });
});

console.log('Generated', dopplerItems.length, 'Doppler items');

// Group by phase for stats
const phaseCount = {};
dopplerItems.forEach(item => {
  phaseCount[item.doppler_phase] = (phaseCount[item.doppler_phase] || 0) + 1;
});
console.log('\nBreakdown by phase:');
Object.entries(phaseCount).forEach(([phase, count]) => {
  console.log(`  ${phase}: ${count}`);
});

// Write to JSON file
fs.writeFileSync(
  path.join(__dirname, '..', 'doppler-items.json'),
  JSON.stringify(dopplerItems, null, 2)
);

console.log('\nWrote doppler-items.json');

// Also generate TypeScript code
let tsCode = '// Doppler Phase Items - Auto-generated\n';
tsCode += '// Total: ' + dopplerItems.length + ' items\n\n';
tsCode += 'export const dopplerItems: Item[] = [\n';

dopplerItems.forEach((item, idx) => {
  tsCode += '  {\n';
  tsCode += `    id: ${item.id},\n`;
  tsCode += `    name: "${item.name}",\n`;
  tsCode += `    type: "${item.type}",\n`;
  tsCode += `    weapon: "${item.weapon}",\n`;
  tsCode += `    wear: "${item.wear}",\n`;
  tsCode += `    min_float: ${item.min_float},\n`;
  tsCode += `    max_float: ${item.max_float},\n`;
  tsCode += `    image_url: "${item.image_url}",\n`;
  tsCode += `    is_tradeable: true,\n`;
  tsCode += `    doppler_phase: "${item.doppler_phase}"\n`;
  tsCode += '  }' + (idx < dopplerItems.length - 1 ? ',' : '') + '\n';
});

tsCode += '];\n';

fs.writeFileSync(
  path.join(__dirname, '..', 'lib', 'doppler-items.ts'),
  tsCode
);

console.log('Wrote lib/doppler-items.ts');

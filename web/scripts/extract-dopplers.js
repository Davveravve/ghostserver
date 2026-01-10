const fs = require('fs');
const path = require('path');

// Read the doppler data
const dopplerData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'doppler_data.json'), 'utf8'));

const allKeys = Object.keys(dopplerData);
console.log('Total items:', allKeys.length);

// Find all Doppler phase items
const dopplerKeys = allKeys.filter(key => {
  return key.includes('Doppler') && (
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

console.log('\nFound Doppler phase items:', dopplerKeys.length);

// Group by phase type
const phases = {
  ruby: [],
  sapphire: [],
  blackPearl: [],
  emerald: [],
  phase1: [],
  phase2: [],
  phase3: [],
  phase4: []
};

dopplerKeys.forEach(key => {
  const item = dopplerData[key];
  if (key.includes('Ruby')) phases.ruby.push({ key, item });
  else if (key.includes('Sapphire')) phases.sapphire.push({ key, item });
  else if (key.includes('Black Pearl')) phases.blackPearl.push({ key, item });
  else if (key.includes('Emerald')) phases.emerald.push({ key, item });
  else if (key.includes('Phase 1')) phases.phase1.push({ key, item });
  else if (key.includes('Phase 2')) phases.phase2.push({ key, item });
  else if (key.includes('Phase 3')) phases.phase3.push({ key, item });
  else if (key.includes('Phase 4')) phases.phase4.push({ key, item });
});

console.log('\nBreakdown by phase:');
console.log('Ruby:', phases.ruby.length);
console.log('Sapphire:', phases.sapphire.length);
console.log('Black Pearl:', phases.blackPearl.length);
console.log('Emerald:', phases.emerald.length);
console.log('Phase 1:', phases.phase1.length);
console.log('Phase 2:', phases.phase2.length);
console.log('Phase 3:', phases.phase3.length);
console.log('Phase 4:', phases.phase4.length);

// Show sample items
console.log('\n--- Sample Ruby item ---');
if (phases.ruby.length > 0) {
  console.log('Key:', phases.ruby[0].key);
  console.log('Item:', JSON.stringify(phases.ruby[0].item, null, 2));
}

console.log('\n--- Sample Phase 1 item ---');
if (phases.phase1.length > 0) {
  console.log('Key:', phases.phase1[0].key);
  console.log('Item:', JSON.stringify(phases.phase1[0].item, null, 2));
}

console.log('\n--- All Ruby keys ---');
phases.ruby.forEach(p => console.log(p.key));

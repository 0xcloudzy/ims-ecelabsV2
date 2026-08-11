const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Equipment = mongoose.model('Equipment', new mongoose.Schema({ name: String, isConsumable: Boolean }, { strict: false }));
  
  const workbook = XLSX.readFile('C:\\Users\\sidsh\\Downloads\\RF and Applied Electromagnetics Lab Resources.xlsx');
  const cSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('consumable') && !n.toLowerCase().includes('non-consumable'));
  const ws = workbook.Sheets[cSheetName];
  const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });
  
  const consumableNames = rawJson.map(row => {
    const keys = ['equipments/tools', 'equipments/tools*', 'name', 'equipment name', 'item'];
    const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
    return key ? String(row[key] || '').trim() : '';
  }).filter(n => n !== '');
  
  console.log('Found', consumableNames.length, 'consumable names from Excel.');
  
  const result = await Equipment.updateMany(
    { name: { $in: consumableNames.map(n => new RegExp('^' + n.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i')) } },
    { $set: { isConsumable: true } }
  );
  
  console.log('Updated ' + result.modifiedCount + ' items in the database to be isConsumable: true');
  process.exit(0);
}).catch(console.error);

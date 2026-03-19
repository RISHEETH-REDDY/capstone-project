const XLSX = require('xlsx');
const fs = require('fs');

const file = 'SmartClass_Final_Scaled (1).xlsx';

if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
}

const workbook = XLSX.readFile(file);
const sheetNames = workbook.SheetNames;

console.log('Sheets:', sheetNames);

const output = [];
sheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (json.length > 0) {
        output.push(`\n--- Sheet: ${sheetName} ---`);
        output.push('Headers: ' + JSON.stringify(json[0]));
        if (json.length > 1) {
            output.push('First Row Data: ' + JSON.stringify(json[1]));
        }
    }
});
fs.writeFileSync('excel_structure.txt', output.join('\n'));
console.log('Structure written to excel_structure.txt');

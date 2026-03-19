const XLSX = require('xlsx');

const file = 'SmartClass_Final_Scaled (1).xlsx';
const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['Students'];
const data = XLSX.utils.sheet_to_json(sheet);

const emails = {};
const duplicates = [];

data.forEach(row => {
    if (emails[row.email]) {
        duplicates.push({
            email: row.email,
            firstRoll: emails[row.email].rollNumber,
            secondRoll: row.rollNumber
        });
    } else {
        emails[row.email] = row;
    }
});

console.log('Duplicate emails found:', duplicates.length);
if (duplicates.length > 0) {
    console.log('Sample duplicates:', JSON.stringify(duplicates.slice(0, 5), null, 2));
}

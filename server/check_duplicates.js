const XLSX = require('xlsx');

const file = 'SmartClass_Final_Scaled (1).xlsx';
const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets['Students'];
const data = XLSX.utils.sheet_to_json(sheet);

const rollNumbers = {};
const duplicates = [];

data.forEach(row => {
    if (rollNumbers[row.rollNumber]) {
        duplicates.push({
            rollNumber: row.rollNumber,
            firstEmail: rollNumbers[row.rollNumber].email,
            secondEmail: row.email
        });
    } else {
        rollNumbers[row.rollNumber] = row;
    }
});

console.log('Duplicates found:', JSON.stringify(duplicates, null, 2));

const axios = require('axios');
const fs = require('fs');

async function capture() {
    try {
        const summary = await axios.get('http://localhost:5000/api/analytics/summary');
        fs.writeFileSync('summary_response.json', JSON.stringify(summary.data, null, 2));
        console.log('Summary captured.');
    } catch (err) {
        console.error('Summary capture failed:', err.message);
    }

    try {
        const distribution = await axios.get('http://localhost:5000/api/analytics/distribution');
        fs.writeFileSync('distribution_response.json', JSON.stringify(distribution.data, null, 2));
        console.log('Distribution captured.');
    } catch (err) {
        console.error('Distribution capture failed:', err.message);
    }
    process.exit(0);
}
capture();

const axios = require('axios');

async function test() {
    try {
        console.log('Fetching /api/analytics/summary...');
        const res = await axios.get('http://localhost:5000/api/analytics/summary');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error fetching summary:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
    }

    try {
        console.log('\nFetching /api/analytics/distribution...');
        const res = await axios.get('http://localhost:5000/api/analytics/distribution');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error fetching distribution:', err.message);
    }
}

test();

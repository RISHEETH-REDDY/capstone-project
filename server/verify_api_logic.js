const http = require('http');

async function checkApi(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('--- Testing Student Batch Filtering (AIDS1A) ---');
        const studentRes = await checkApi('http://localhost:5000/api/analytics/summary?batchId=AIDS1A');
        console.log('Total Classes for AIDS1A:', studentRes.totals.classes);

        console.log('\n--- Testing Faculty Filtering (Aditya Khan) ---');
        // ID: 691b822acd682ecd200bd174
        const facultyRes = await checkApi('http://localhost:5000/api/analytics/summary?facultyId=691b822acd682ecd200bd174');
        console.log('Total Classes for Aditya Khan:', facultyRes.totals.classes);
        
        console.log('\n--- Testing Global Analytics ---');
        const globalRes = await checkApi('http://localhost:5000/api/analytics/summary');
        console.log('Global Total Classes:', globalRes.totals.classes);

        if (studentRes.totals.classes > 0 && facultyRes.totals.classes > 0 && 
            studentRes.totals.classes < globalRes.totals.classes && 
            facultyRes.totals.classes < globalRes.totals.classes) {
            console.log('\nSUCCESS: Personalized filtering is working perfectly for all roles!');
        } else {
            console.log('\nFAILURE: Filtering did not behave as expected.');
            console.log('Details:', { 
                student: studentRes.totals.classes, 
                faculty: facultyRes.totals.classes, 
                global: globalRes.totals.classes 
            });
        }
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}
run();

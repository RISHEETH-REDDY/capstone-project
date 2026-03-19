const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'verification.log';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
}

async function verify() {
    fs.writeFileSync(LOG_FILE, ''); // Clear log
    try {
        log('1. Checking Backend Health...');
        const health = await axios.get('http://localhost:5000');
        log('Backend Status: ' + health.data);

        console.log('\n2. Creating Resources...');
        
        const subjectCode = `CS101_${Date.now()}`;
        
        // Create Classroom
        const room = await axios.post(`${API_URL}/classrooms`, {
            name: 'Room 101',
            roomNumber: `R101_${Date.now()}`,
            capacity: 60,
            type: 'Lecture Hall'
        });
        log('Created Classroom: ' + room.data.name);

        // Create Faculty
        const faculty = await axios.post(`${API_URL}/faculty`, {
            name: 'Dr. Smith',
            email: `smith_${Date.now()}@univ.edu`, // Unique email
            department: 'CSE',
            expertise: [subjectCode],
            maxLoad: 12
        });
        log('Created Faculty: ' + faculty.data.name);

        // Create Subject
        const subject = await axios.post(`${API_URL}/subjects`, {
            name: 'Intro to CS',
            code: subjectCode,
            credits: 4,
            contactHours: 3
        });
        log('Created Subject: ' + subject.data.name);

        log('\n3. Generating Timetable...');
        const batches = [{
            name: 'CSE-A',
            size: 60,
            semester: 5,
            _id: '507f1f77bcf86cd799439011' // Mock ID
        }];

        const schedule = await axios.post(`${API_URL}/generate`, { batches });
        log('Timetable Generated with ' + schedule.data.length + ' entries');
        
        if (schedule.data.length > 0) {
            log('Sample Entry:');
            log(schedule.data[0]);
            log('\nVERIFICATION SUCCESSFUL');
        } else {
            log('\nWARNING: Timeline empty (might be due to constraint satisfaction)');
        }

    } catch (err) {
        log('VERIFICATION FAILED: ' + err.message);
        if (err.response) log('Response: ' + JSON.stringify(err.response.data));
    }
}

verify();

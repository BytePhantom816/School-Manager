

const BASE_URL = 'http://localhost:5000/api';

async function login(username, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(`Login failed for ${username}: ${res.statusText}`);
    return res.json();
}

async function runTest() {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Admin Login
        console.log('1. Admin Login...');
        const adminAuth = await login('admin', 'password123');
        const adminToken = adminAuth.token;
        console.log('   Admin logged in.');

        // 2. Create Roaming Teacher (if not exists)
        console.log('2. Creating Roaming Teacher...');
        const roamingUser = {
            username: 'roaming_test',
            password: 'password123',
            role: 'ROAMING_TEACHER',
            full_name: 'Test Roaming Teacher'
        };
        const createRes = await fetch(`${BASE_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify(roamingUser)
        });

        if (createRes.ok) console.log('   Roaming Teacher created.');
        else if (createRes.status === 400) console.log('   Roaming Teacher might already exist.');
        else console.log('   Failed to create roaming teacher:', createRes.statusText);

        // 3. Class Teacher Login
        console.log('3. Class Teacher Login (teacher1a)...');
        const teacherAuth = await login('teacher1a', 'password123');
        const teacherToken = teacherAuth.token;
        const teacherClassId = teacherAuth.user.assigned_class_id;
        console.log(`   Teacher logged in. Class ID: ${teacherClassId}`);

        // 4. Get Students
        console.log('4. Fetching Students...');
        const studentsRes = await fetch(`${BASE_URL}/students/class/${teacherClassId}`, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        const students = await studentsRes.json();
        const student = students[0];
        if (!student) throw new Error('No students found in class.');
        console.log(`   Selected Student: ${student.name} (ID: ${student.id})`);

        // 5. Issue Permission
        console.log('5. Issuing Permission...');
        const issueRes = await fetch(`${BASE_URL}/permissions/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${teacherToken}`
            },
            body: JSON.stringify({
                student_id: student.id,
                reason: 'Test Permission',
                destination: 'Library',
                duration_minutes: 15,
                type: 'STANDARD'
            })
        });
        const permission = await issueRes.json();
        if (!issueRes.ok) throw new Error(`Failed to issue permission: ${issueRes.statusText}`);
        console.log(`   Permission Issued. Code: ${permission.code}, ID: ${permission.id}`);

        // 6. Roaming Teacher Login
        console.log('6. Roaming Teacher Login...');
        const roamingAuth = await login('roaming_test', 'password123');
        const roamingToken = roamingAuth.token;
        console.log('   Roaming Teacher logged in.');

        // 6b. Check Permission Standard (New Flow)
        console.log('6b. Checking Student Permission (New Flow)...');
        const checkRes = await fetch(`${BASE_URL}/permissions/student/${student.id}`, {
            headers: { Authorization: `Bearer ${roamingToken}` }
        });
        const checkData = await checkRes.json();
        if (checkData.hasPermission && checkData.permission.id === permission.id) {
            console.log('   SUCCESS: Student permission verified via lookup.');
        } else {
            console.error('   FAILURE: Student permission lookup failed.', checkData);
        }

        // 7. Check Active Permissions (Global Monitoring)
        console.log('7. Checking Active Permissions...');
        const activeRes = await fetch(`${BASE_URL}/permissions/active`, {
            headers: { Authorization: `Bearer ${roamingToken}` }
        });
        const activeData = await activeRes.json();
        const found = activeData.find(p => p.id === permission.id);

        if (found) {
            console.log('   SUCCESS: Permission found in active list.');
            console.log(`   Student: ${found.student_name}, Destination: ${found.destination}`);
        } else {
            console.error('   FAILURE: Permission NOT found in active list.');
        }

        console.log('--- VERIFICATION COMPLETE ---');

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

runTest();

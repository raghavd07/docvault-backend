const fs = require('fs');

async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin_secure_password123' })
    });

    if (!loginRes.ok) {
      console.log('Login failed', await loginRes.text());
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in', token);

    // Create a dummy file
    fs.writeFileSync('dummy.txt', 'hello world');

    // Instead of using node's fetch which handles FormData a bit differently,
    // let's just make a manual multipart request using http

    const boundary = '----WebKitFormBoundary7xJQA0Vj3H';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="name"',
      '',
      'Test File',
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="dummy.txt"',
      'Content-Type: text/plain',
      '',
      fs.readFileSync('dummy.txt', 'utf8'),
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const res = await fetch('http://localhost:5000/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    const text = await res.text();
    console.log('Upload status:', res.status);
    console.log('Upload response:', text.slice(0, 500));
  } catch (err) {
    console.log('Caught Error:', err.message);
  }
}

test();

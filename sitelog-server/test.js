async function test() {
  try {
    const baseUrl = 'http://localhost:5000/api/v1';
    
    // Login to get token
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@plinth.hq', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    
    // Get projects
    const projRes = await fetch(`${baseUrl}/projects`, { headers });
    const projData = await projRes.json();
    const project = projData.data[0];
    console.log('Project:', project.name, project.id);
    
    // Get logs
    const logsRes = await fetch(`${baseUrl}/projects/${project.id}/logs`, { headers });
    const logsData = await logsRes.json();
    let log = logsData.data[0];
    
    if (!log) {
      console.log('Creating log...');
      const createRes = await fetch(`${baseUrl}/projects/${project.id}/logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: new Date().toISOString(),
          weather: 'sunny',
          activities: 'Test activities'
        })
      });
      const createData = await createRes.json();
      log = createData.data;
    }
    
    console.log('Log ID:', log.id || log._id);
    console.log('Log before:', log.materials);
    
    // Update log with material
    const newMat = { name: 'TestMaterial', qty: '10', unit: 'bags', price: 500, recdAt: new Date().toISOString() };
    const updateRes = await fetch(`${baseUrl}/projects/${project.id}/logs/${log.id || log._id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        materials: [...(log.materials || []), newMat]
      })
    });
    
    const updateData = await updateRes.json();
    console.log('Log after:', updateData.data.materials);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

test();

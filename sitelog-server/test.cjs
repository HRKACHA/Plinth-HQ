const axios = require('axios');

async function test() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api/v1' });
    
    // Login to get token
    const loginRes = await api.post('/auth/login', { email: 'admin@plinth.hq', password: 'password123' });
    const token = loginRes.data.data.accessToken;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Get projects
    const projRes = await api.get('/projects');
    const project = projRes.data.data[0];
    console.log('Project:', project.name, project.id);
    
    // Get logs
    const logsRes = await api.get(`/projects/${project.id}/logs`);
    let log = logsRes.data.data[0];
    
    if (!log) {
      console.log('Creating log...');
      const createRes = await api.post(`/projects/${project.id}/logs`, {
        date: new Date().toISOString(),
        weather: 'sunny',
        activities: 'Test activities'
      });
      log = createRes.data.data;
    }
    
    console.log('Log before:', log.materials);
    
    // Update log with material
    const newMat = { name: 'TestMaterial', qty: '10', unit: 'bags', price: 500, recdAt: new Date() };
    const updateRes = await api.put(`/projects/${project.id}/logs/${log.id}`, {
      materials: [...(log.materials || []), newMat]
    });
    
    console.log('Log after:', updateRes.data.data.materials);
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();

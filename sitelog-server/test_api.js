async function test() {
  try {
    const baseURL = 'http://localhost:5000/api/v1';
    
    // Login to get token
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hrkacha1@gmail.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(JSON.stringify(loginData));
    
    const token = loginData.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log("Logged in successfully.");
    
    try {
        console.log("Testing members...");
        const m = await fetch(`${baseURL}/team/members`, { headers });
        const data = await m.json();
        if(!data.success) throw new Error(JSON.stringify(data));
        console.log("Members success:", data.data.length);
    } catch(e) {
        console.error("Members error:", e.message);
    }
    
    try {
        console.log("Testing invites...");
        const i = await fetch(`${baseURL}/invite/list`, { headers });
        const data = await i.json();
        if(!data.success) throw new Error(JSON.stringify(data));
        console.log("Invites success:", data.data.length);
    } catch(e) {
        console.error("Invites error:", e.message);
    }
    
    try {
        console.log("Testing projects...");
        const p = await fetch(`${baseURL}/projects`, { headers });
        const data = await p.json();
        if(!data.success) throw new Error(JSON.stringify(data));
        console.log("Projects success:", data.data?.length || "no length");
    } catch(e) {
        console.error("Projects error:", e.message);
    }
    
  } catch (err) {
    console.error("Login failed:", err.message);
  }
}

test();

const fetch = require('node-fetch'); // In node 18+, fetch is global, but just in case
async function test() {
  try {
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
    console.log(geo);
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`).then(r => r.json());
    console.log(w.current_weather);
  } catch (e) {
    console.error(e);
  }
}
test();

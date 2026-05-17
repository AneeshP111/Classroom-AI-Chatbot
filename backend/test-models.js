require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    console.log("Testing API Key:", process.env.GEMINI_API_KEY.slice(0, 10) + "...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.models) {
      console.log("Your API key successfully loaded these models:");
      data.models.forEach(m => console.log(" - " + m.name));
    } else {
      console.error("Failed to load models. API returned:", data);
    }
  } catch(e) {
    console.error("Network or script error:", e.message);
  }
}
test();

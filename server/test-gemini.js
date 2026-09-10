const { GoogleGenerativeAI } = require('@google/generative-ai');

const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  let urlObj = new URL(url);
  const key = urlObj.searchParams.get('key');
  if (key && key.startsWith('AQ.')) {
    urlObj.searchParams.delete('key');
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${key}`;
  }
  return originalFetch(urlObj.toString(), options);
};

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");
async function test() {
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("hello");
    console.log("SUCCESS:", result.response.text());
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();

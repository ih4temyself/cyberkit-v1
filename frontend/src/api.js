// Auto-detect API URL based on environment
// In production, nginx proxies /api/ to backend, so use relative path
// In development, connect directly to backend
const getApiUrl = () => {
  // In production (cyberkit.space), nginx proxies /api/ to backend
  if (window.location.hostname === 'cyberkit.space' || window.location.hostname === 'www.cyberkit.space') {
    return '/api';  // Relative path - nginx will proxy to backend
  }
  // In development, connect directly to backend on port 9000
  return 'http://localhost:9000/api';
};

const API = getApiUrl();

const getStaticBaseUrl = () => {
  if (/^https?:\/\//i.test(API)) {
    const { origin } = new URL(API);
    return origin;
  }
  return '';
};

const STATIC_BASE = getStaticBaseUrl();

export const resolveStaticUrl = (path = '') => {
  if (!path) return '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${STATIC_BASE}${normalized}`;
};

export async function fetchModules(){
  const r = await fetch(`${API}/modules`);
  return await r.json();
}

export async function fetchModule(id){
  const r = await fetch(`${API}/modules/${id}`);
  return await r.json();
}

export async function checkAnswer(moduleId, questionId, answerIndex){
  const r = await fetch(`${API}/modules/${moduleId}/quiz/check`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({question_id: questionId, answer_index: answerIndex})
  });
  return await r.json();
}

export async function gradeQuiz(id, answers){
  const r = await fetch(`${API}/modules/${id}/quiz/grade`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({answers})
  });
  return await r.json();
}

export async function checkPassword(password){
  const r = await fetch(`${API}/password/check`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ password })
  });
  if(!r.ok){
    const text = await r.text().catch(()=> '')
    throw new Error(text || 'Password check failed')
  }
  return await r.json();
}
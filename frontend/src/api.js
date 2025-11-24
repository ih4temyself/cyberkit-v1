const API = 'http://localhost:9000/api';

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
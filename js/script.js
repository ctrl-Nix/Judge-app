// PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let chatHistory = [];
let pendingFilePrompt = null;
let msgCount = 0;
const MAX_MSGS = 10;

// ── LANDING ──────────────────────────────────────────────
function startChat(openingLine) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('chat-view').style.display = 'flex';
  if (openingLine !== null) {
    const line = openingLine || "Aaj kaise aana hua?";
    setTimeout(() => appendBot(line), 400);
  }
}

// ── FILE HANDLING ─────────────────────────────────────────
async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  startChat(null);
  await processAndRoastFile(file);
}

async function handleChatFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('attach-label').textContent = file.name + ' — attached';
  document.getElementById('attach-btn').classList.add('active');
  pendingFilePrompt = await extractFilePrompt(file);
}

async function extractFilePrompt(file) {
  if (file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
      return `The user uploaded a PDF named "${file.name}". Content:\n\n${fullText.slice(0, 3000)}\n\nRoast this brutally — the content, the effort, the fact that they thought uploading this was a good idea.`;
    } catch {
      return `User uploaded a PDF called "${file.name}" but it was unreadable. Roast them for uploading a broken file.`;
    }
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return `The user uploaded a Word Document named "${file.name}". Content:\n\n${result.value.slice(0, 3000)}\n\nRoast this brutally — the content, the effort, the fact that they thought uploading this was a good idea.`;
    } catch {
      return `User uploaded a Document called "${file.name}" but it was unreadable. Roast them for uploading a broken file.`;
    }
  } else if (file.type.startsWith('image/')) {
    return `User uploaded an image called "${file.name}". Roast them for thinking their image deserves your attention.`;
  } else {
    try {
      const text = await file.text();
      return `The user uploaded a file named "${file.name}". Content:\n\n${text.slice(0, 3000)}\n\nRoast this. The content, the effort, the audacity.`;
    } catch {
      return `User uploaded "${file.name}". Roast them for uploading something unreadable.`;
    }
  }
}

async function processAndRoastFile(file) {
  appendUser('Uploaded: ' + file.name, true);
  const prompt = await extractFilePrompt(file);
  await callAPI(prompt);
}

// ── MESSAGING ─────────────────────────────────────────────
function checkEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const val = input.value.trim();
  if (!val && !pendingFilePrompt) return;

  const filePrompt = pendingFilePrompt;
  pendingFilePrompt = null;
  document.getElementById('attach-label').textContent = '';
  document.getElementById('attach-btn').classList.remove('active');
  document.getElementById('chat-file').value = '';

  if (filePrompt && !val) {
    appendUser('Attached a file', true);
  } else if (filePrompt && val) {
    appendUser(val, true);
  } else if (val) {
    appendUser(val, false);
  }
  input.value = '';
  input.style.height = 'auto';

  const prompt = filePrompt
    ? (val ? `${filePrompt}\n\nUser also says: ${val}` : filePrompt)
    : val;

  await callAPI(prompt);
}

// ── API CALL ──────────────────────────────────────────────
async function callAPI(userPrompt) {
  showThinking();
  document.getElementById('send-btn').disabled = true;
  msgCount++;

  try {
    const response = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, history: chatHistory })
    });

    const data = await response.json();
    removeThinking();

    // Check if time for aukaat check
    if (msgCount >= MAX_MSGS) {
      appendBot(data.text);
      setTimeout(() => deliverAukaat(), 1500);
    } else {
      appendBot(data.text);
    }

    chatHistory.push({ role: 'user', parts: [{ text: userPrompt }] });
    chatHistory.push({ role: 'model', parts: [{ text: data.text }] });

  } catch (err) {
    removeThinking();
    appendBot("Bhai tera connection mara hua hai ya mera server. Dono equally sad situations hain.");
  } finally {
    document.getElementById('send-btn').disabled = false;
  }
}

async function deliverAukaat() {
  showThinking();
  try {
    const response = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "Deliver the final Aukaat Check — one single calm, brutal one-liner that implies this person should stop whatever they are doing and open a chai tapri instead. No setup. Just the line.",
        history: chatHistory
      })
    });
    const data = await response.json();
    removeThinking();
    appendAukaat(data.text);

    // Lock input
    document.getElementById('user-input').disabled = true;
    document.getElementById('user-input').placeholder = 'Session ended.';
    document.getElementById('send-btn').disabled = true;
  } catch {
    removeThinking();
  }
}

// ── DOM HELPERS ────────────────────────────────────────────
function appendUser(text, isFile) {
  const div = document.createElement('div');
  div.className = 'msg user';
  if (isFile) {
    div.innerHTML = `<div class="file-badge">FILE</div><br>${escHtml(text)}`;
  } else {
    div.textContent = text;
  }
  document.getElementById('messages').appendChild(div);
  scrollBottom();
}

function appendBot(text) {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.textContent = text;
  document.getElementById('messages').appendChild(div);
  scrollBottom();
}

function appendAukaat(text) {
  const div = document.createElement('div');
  div.className = 'aukaat-block';
  div.innerHTML = `<div class="aukaat-label">Aukaat Check</div><div class="aukaat-text">${escHtml(text)}</div>`;
  document.getElementById('messages').appendChild(div);
  scrollBottom();
}

function showThinking() {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'thinking';
  div.innerHTML = '<div class="thinking"><span></span><span></span><span></span></div>';
  document.getElementById('messages').appendChild(div);
  scrollBottom();
}

function removeThinking() {
  const el = document.getElementById('thinking');
  if (el) el.remove();
}

function scrollBottom() {
  const m = document.getElementById('messages');
  m.scrollTop = m.scrollHeight;
}

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

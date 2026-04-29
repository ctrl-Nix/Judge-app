// PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let chatHistory = [];
let pendingFilePrompt = null;
let msgCount = 0;
let boredomCount = 0;
const MAX_MSGS = 12;

async function getContext() {
  let context = `Time: ${new Date().toLocaleTimeString()}, Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`;
  try {
    const battery = await navigator.getBattery();
    context += `, Battery: ${Math.round(battery.level * 100)}%${battery.charging ? ' (charging)' : ''}`;
  } catch (e) {}
  return context;
}

function shakeScreen() {
  const b = document.body;
  b.style.transition = 'none';
  b.style.transform = 'translateX(4px)';
  setTimeout(() => { b.style.transform = 'translateX(-4px)'; setTimeout(() => { b.style.transform = 'none'; }, 50); }, 50);
}

// ── LANDING ──────────────────────────────────────────────
function startReset() {
  const msgs = document.querySelectorAll('.msg, .aukaat-block');
  if (msgs.length === 0) return location.reload();
  msgs.forEach((m, i) => {
    setTimeout(() => m.classList.add('burn'), i * 30);
  });
  setTimeout(() => location.reload(), msgs.length * 30 + 500);
}

function startChat(openingLine) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('chat-view').style.display = 'flex';
  startHeartbeat();
  if (openingLine !== null) {
    const line = openingLine || "Aaj kaise aana hua?";
    setTimeout(() => appendBot(line), 400);
  }
}

// ── GLOBAL HEARTBEAT ──────────────────────────────────────
function startHeartbeat() {
  const countEl = document.querySelector('.heartbeat .count');
  let current = 2841;
  setInterval(() => {
    current += Math.floor(Math.random() * 5) - 2;
    countEl.textContent = current.toLocaleString();
  }, 3000);
}

// ── ARCHIVE (SIN REGISTRY) ────────────────────────────────
function toggleArchive() {
  const sidebar = document.getElementById('sidebar-archive');
  sidebar.classList.toggle('open');
  if (sidebar.classList.contains('open')) loadArchive();
}

function archiveRoast(text) {
  let registry = JSON.parse(localStorage.getItem('sin_registry') || '[]');
  registry.unshift({ text, date: new Date().toISOString() });
  localStorage.setItem('sin_registry', JSON.stringify(registry.slice(0, 50)));
}

function loadArchive() {
  const list = document.getElementById('archive-list');
  const registry = JSON.parse(localStorage.getItem('sin_registry') || '[]');
  if (registry.length === 0) {
    list.innerHTML = '<div class="archive-item">No sins recorded yet. You are suspiciously clean.</div>';
    return;
  }
  list.innerHTML = registry.map(item => `
    <div class="archive-item">
      "${item.text}"
      <div style="font-size:0.6rem; margin-top:0.5rem; opacity:0.3">${new Date(item.date).toLocaleString()}</div>
    </div>
  `).join('');
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
      return `The user uploaded a PDF named "${file.name}". Content:\n\n${fullText.slice(0, 3000)}\n\nRoast this brutally.`;
    } catch {
      return `User uploaded a PDF called "${file.name}" but it was unreadable. Roast them.`;
    }
  } else if (file.type.startsWith('image/')) {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { type: 'image', data: base64, mime: file.type, name: file.name };
  } else {
    try {
      const text = await file.text();
      return `The user uploaded a file named "${file.name}". Content:\n\n${text.slice(0, 3000)}\n\nRoast this.`;
    } catch {
      return `User uploaded "${file.name}". Roast them.`;
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
  
  if (val.startsWith('/')) {
    handleCommand(val);
    input.value = '';
    return;
  }

  if (val.length < 4 && !pendingFilePrompt) {
    boredomCount++;
    if (boredomCount >= 3) {
      appendBot("I'm bored of this. Talk properly or don't talk at all.");
      input.disabled = true;
      setTimeout(() => { input.disabled = false; input.focus(); boredomCount = 0; }, 5000);
      return;
    }
  } else { boredomCount = 0; }

  if (!val && !pendingFilePrompt) return;

  const filePrompt = pendingFilePrompt;
  pendingFilePrompt = null;
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

  const promptPayload = filePrompt ? { file: filePrompt, text: val } : { text: val };
  await callAPI(promptPayload);
}

// ── HACKER COMMANDS ───────────────────────────────────────
function handleCommand(cmd) {
  const c = cmd.toLowerCase().split(' ')[0];
  switch (c) {
    case '/aukaat':
      deliverAukaat();
      break;
    case '/mercy':
      appendBot("Mercy? In this economy? You're lucky I even responded.");
      break;
    case '/clear':
      localStorage.removeItem('sin_registry');
      appendBot("Registry wiped. Your sins are gone, but your character remains flawed.");
      break;
    case '/identity':
      appendBot("I am the Judge. You are the subject. The hierarchy is clear.");
      break;
    default:
      appendBot(`Unknown command: ${c}. Even your hacks are mediocre.`);
  }
}

// ── API CALL ──────────────────────────────────────────────
async function callAPI(payload) {
  showThinking();
  document.getElementById('send-btn').disabled = true;
  msgCount++;

  const context = await getContext();
  const userPrompt = payload.file ? (payload.text ? `${payload.file.name || 'File'}: ${payload.text}` : 'Attached a file') : payload.text;

  try {
    const response = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: payload, 
        history: chatHistory,
        context: context,
        msgCount: msgCount,
        MAX_MSGS: MAX_MSGS 
      })
    });

    const data = await response.json();
    removeThinking();

    if (data.text) {
      shakeScreen();
      appendBot(data.text);
      archiveRoast(data.text);
      if (data.triggerAukaat) {
        setTimeout(() => deliverAukaat(), 1500);
      }
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
        prompt: "Deliver the final Aukaat Check — one single calm, brutal one-liner. No setup.",
        history: chatHistory
      })
    });
    const data = await response.json();
    removeThinking();
    appendAukaat(data.text);
    archiveRoast("FINAL VERDICT: " + data.text);

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
  div.innerHTML = `
    <div class="aukaat-card">
      <div class="aukaat-label">Final Aukaat Check</div>
      <div class="aukaat-text">${escHtml(text)}</div>
      <div class="share-row">
        <button class="reset-btn" onclick="startReset()">Reset</button>
        <button class="share-btn" onclick="copyRoast('${text.replace(/'/g, "\\'")}')">Copy Verdict</button>
      </div>
    </div>
  `;
  document.getElementById('messages').appendChild(div);
  scrollBottom();
}

function copyRoast(text) {
  const shareText = `Judge AI Verdict:\n"${text}"\n\nCheck yours at Judge.`;
  navigator.clipboard.writeText(shareText);
  const btn = event.target;
  const oldText = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = oldText, 2000);
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

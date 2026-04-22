
function openTab(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

// --- Toast Notification ---
function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 2000);
}

// --- JSON Logic ---
let history = [""];
let step = 0;

function runJsonMagic() {
    const input = document.getElementById('jsonInput');
    const preview = document.getElementById('jsonPreview');
    try {
        let raw = input.value;
        let fixed = raw.replace(/'/g, '"').replace(/,\s*([\]}])/g, '$1').replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
        const obj = JSON.parse(fixed);
        const formatted = JSON.stringify(obj, null, 4);
        input.value = formatted;
        preview.innerHTML = colorize(obj);
        history.push(formatted);
        step++;
        document.getElementById('undoBtn').disabled = false;
    } catch(e) { preview.innerHTML = `<span style="color:#ef4444">Error: ${e.message}</span>`; }
}

function colorize(json) {
    if (typeof json != 'string') json = JSON.stringify(json, null, 4);
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'json-num';
        if (/^"/.test(match)) { cls = (/:$/.test(match)) ? 'json-key' : 'json-string'; }
        else if (/true|false/.test(match)) { cls = 'json-bool'; }
        else if (/null/.test(match)) { cls = 'json-null'; }
        return `<span class="${cls}">${match}</span>`;
    });
}

function undo() {
    if(step > 0) {
        step--;
        document.getElementById('jsonInput').value = history[step];
        document.getElementById('jsonPreview').innerHTML = "Click Fix to refresh highlight.";
        if(step === 0) document.getElementById('undoBtn').disabled = true;
    }
}

// --- Copy & Paste Logic ---
function copyGeneric(id, name) {
    const val = document.getElementById(id).value;
    if(!val) return;
    navigator.clipboard.writeText(val);
    showToast(`${name} tersalin!`);
}

function copyDirect(id) {
    const val = document.getElementById(id).innerText;
    if(!val || val === "-") return;
    navigator.clipboard.writeText(val);
    showToast(`Hash ${id.toUpperCase()} tersalin!`);
}

async function pasteToHash() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('hashInput').value = text;
        doHash();
        showToast("Berhasil ditempel!");
    } catch (err) {
        alert("Gagal mengakses clipboard. Pastikan izin diberikan.");
    }
}

// --- Hash Logic ---
function doHash() {
    const v = document.getElementById('hashInput').value;
    if(!v) {
        document.querySelectorAll('.hash-val').forEach(el => el.innerText = "-");
        return;
    }
    document.getElementById('md5').innerText = CryptoJS.MD5(v);
    document.getElementById('sha1').innerText = CryptoJS.SHA1(v);
    document.getElementById('sha256').innerText = CryptoJS.SHA256(v);
    document.getElementById('sha512').innerText = CryptoJS.SHA512(v);
}

// --- SQL ---
function formatSQL() {
    const input = document.getElementById('sqlInput');
    const preview = document.getElementById('sqlPreview');
    let sql = input.value.trim();
    
    // Simple SQL Formatter Logic
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY', 'LIMIT', 'INSERT INTO', 'UPDATE', 'DELETE', 'JOIN', 'LEFT JOIN', 'SET', 'VALUES'];
    
    let formatted = sql.replace(/\s+/g, ' '); // normalisasi spasi
    keywords.forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        formatted = formatted.replace(regex, `\n${key.toUpperCase()}`);
    });

    const result = formatted.trim();
    input.value = result;

    // Highlight Keywords
    let highlighted = result.replace(/\b(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|LIMIT|INSERT|UPDATE|DELETE|JOIN|SET|VALUES)\b/g, '<span class="sql-keyword">$1</span>');
    preview.innerHTML = highlighted;

    saveToHistory('SQL Format', input.value);
}

// --- Utils ---
function copyValue(id) {
    navigator.clipboard.writeText(document.getElementById(id).value);
    showToast("Copied!");
}

// --- TEXT UTILS LOGIC ---
function updateTextStats() {
    const val = document.getElementById('textInput').value;
    document.getElementById('charCount').innerText = val.length;
    const words = val.trim() === "" ? 0 : val.trim().split(/\s+/).length;
    document.getElementById('wordCount').innerText = words;
}

function changeCase(type) {
    const input = document.getElementById('textInput');
    if (type === 'upper') input.value = input.value.toUpperCase();
    if (type === 'lower') input.value = input.value.toLowerCase();
    if (type === 'title') {
        input.value = input.value.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    updateTextStats();
}

// --- DIFF CHECKER LOGIC ---
function compareTexts() {
    const oldText = document.getElementById('diffOld').value.split('\n');
    const newText = document.getElementById('diffNew').value.split('\n');
    const resultArea = document.getElementById('diffResult');
    
    let output = '';
    const maxLength = Math.max(oldText.length, newText.length);

    for (let i = 0; i < maxLength; i++) {
        const lineOld = oldText[i] || "";
        const lineNew = newText[i] || "";

        if (lineOld === lineNew) {
            output += `<span class="diff-equal">${lineOld || ' '}</span>`;
        } else {
            if (lineOld !== "") {
                output += `<span class="diff-removed">- ${lineOld}</span>`;
            }
            if (lineNew !== "") {
                output += `<span class="diff-added">+ ${lineNew}</span>`;
            }
        }
    }

    resultArea.innerHTML = output || "Tidak ada perbedaan.";
    resultArea.style.display = "block";
}

function clearDiff() {
    document.getElementById('diffOld').value = '';
    document.getElementById('diffNew').value = '';
    document.getElementById('diffResult').style.display = 'none';
}

// --- CODEC LOGIC ---
function runCodec() {
    const val = document.getElementById('codecInput').value;
    if(!val) {
        document.querySelectorAll('#codecPage .hash-val').forEach(el => el.innerText = "-");
        return;
    }

    // Base64
    try {
        document.getElementById('b64Enc').innerText = btoa(val);
        document.getElementById('b64Dec').innerText = atob(val);
    } catch(e) {
        document.getElementById('b64Dec').innerText = "Invalid Base64";
    }

    // URL
    document.getElementById('urlEnc').innerText = encodeURIComponent(val);
    try {
        document.getElementById('urlDec').innerText = decodeURIComponent(val);
    } catch(e) {
        document.getElementById('urlDec').innerText = "Invalid URL";
    }
}

function decodeJWT() {
    const token = document.getElementById('jwtInput').value.trim();
    const preview = document.getElementById('jwtPayload');
    
    if(!token) {
        preview.innerHTML = "Result will appear here...";
        return;
    }

    const parts = token.split('.');
    if(parts.length !== 3) {
        preview.innerHTML = "<span style='color:#ef4444'>❌ Invalid JWT: Harus terdiri dari 3 bagian (Header.Payload.Signature)</span>";
        return;
    }

    try {
        // Fungsi untuk decode Base64URL ke JSON secara aman
        const parsePart = (str) => {
            // 1. Perbaiki karakter Base64URL ke Base64 standar
            // 2. Tambahkan padding '=' jika hilang
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
                .padEnd(str.length + (4 - str.length % 4) % 4, '=');
            
            // 3. Decode menggunakan atob dan handle karakter non-ASCII (UTF-8)
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        };

        const header = parsePart(parts[0]);
        const payload = parsePart(parts[1]);
        
        // Tampilkan hasil dengan pewarnaan yang sudah kita buat sebelumnya
        let html = `<b style="color:var(--accent); font-size:0.7rem; text-transform:uppercase;">Header</b><br>${colorize(header)}<br><br>`;
        html += `<b style="color:var(--accent); font-size:0.7rem; text-transform:uppercase;">Payload</b><br>${colorize(payload)}`;
        
        preview.innerHTML = html;
    } catch(e) {
        console.error(e);
        preview.innerHTML = `<span style="color:#ef4444">❌ Error: Gagal men-decode konten token. Pastikan token valid.</span><br><small style="color:#666">${e.message}</small>`;
    }
}

// Data Dummy Master
const dummySource = {
    name: ["Ismi Azis", "Budi Santoso", "Siti Aminah", "John Doe", "Jane Smith"],
    email: ["admin@test.com", "user@ismidev.pro", "tester@qa.id", "dev@tech.io"],
    city: ["Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta"],
    status: ["Active", "Inactive", "Pending", "Suspended"]
};

// Fungsi Tambah Baris Konfigurasi
function addGenRow() {
    const container = document.getElementById('genConfig');
    const div = document.createElement('div');
    div.className = 'gen-row';
    div.innerHTML = `
        <input type="text" placeholder="Key (misal: nama)" class="gen-key-input">
        <select class="gen-type-input">
            <option value="name">Nama</option>
            <option value="email">Email</option>
            <option value="number">Angka Acak</option>
            <option value="city">Kota</option>
            <option value="status">Status</option>
            <option value="boolean">Boolean</option>
        </select>
        <button class="btn-del" onclick="this.parentElement.remove()"><i data-lucide="trash-2" size="16"></i></button>
    `;
    container.appendChild(div);
    // PENTING: Render ulang icon Lucide setelah elemen baru ditambah
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    // lucide.createIcons();
}

// Fungsi Generate JSON
function generateDummyJSON() {
    const rows = document.querySelectorAll('.gen-row');
    const count = parseInt(document.getElementById('genCount').value);
    const result = [];

    for (let i = 0; i < count; i++) {
        let obj = {};
        rows.forEach(row => {
            const key = row.querySelector('.gen-key-input').value || "key_" + Math.random().toString(36).substring(7);
            const type = row.querySelector('.gen-type-input').value;
            
            let value;
            if (type === 'number') value = Math.floor(Math.random() * 1000);
            else if (type === 'boolean') value = Math.random() > 0.5;
            else {
                const source = dummySource[type];
                value = source[Math.floor(Math.random() * source.length)];
            }
            obj[key] = value;
        });
        result.push(obj);
    }

    const finalOutput = count === 1 ? result[0] : result;
    const preview = document.getElementById('genPreview');
    preview.innerHTML = colorize(finalOutput);
    // Simpan teks mentah agar bisa di-copy
    preview.setAttribute('data-raw', JSON.stringify(finalOutput, null, 4));
}

function copyGenResult() {
    const preview = document.getElementById('genPreview');
    const rawData = preview.getAttribute('data-raw');
    
    if (!rawData || rawData === "Hasil JSON akan muncul di sini...") {
        alert("Generate data dulu!");
        return;
    }
    
    navigator.clipboard.writeText(rawData);
    showToast("JSON Dummy tersalin!");
}

function generatePasswordHash() {
    const password = document.getElementById('passInput').value;
    const resultDiv = document.getElementById('bcryptResult');
    
    if (!password) {
        alert("Masukkan password terlebih dahulu!");
        return;
    }

    try {
        // Menggunakan salt round 10 (standar industri)
        const salt = dcodeIO.bcrypt.genSaltSync(10);
        const hash = dcodeIO.bcrypt.hashSync(password, salt);
        
        resultDiv.innerText = hash;
        showToast("Password Berhasil Di-hash!");
    } catch (e) {
        resultDiv.innerText = "Error: " + e.message;
    }
    saveToHistory('Bcrypt Hash', password);
}

// Fungsi Export untuk mengambil data dari element apa pun
function exportJSON(elementId) {
    const element = document.getElementById(elementId);
    // Cek apakah data ada di value (textarea) atau data-raw (preview div)
    const data = element.value || element.getAttribute('data-raw');

    if (!data || data === "Result..." || data === "Hasil JSON akan muncul di sini...") {
        showToast("Tidak ada data untuk di-export!");
        return;
    }

    try {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ismidev-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("File JSON berhasil di-download!");
    } catch (e) {
        showToast("Gagal export file!");
    }
}

// --- HISTORY LOGIC ---

// 1. Fungsi untuk menyimpan riwayat (Panggil ini di setiap fitur utama)
function saveToHistory(type, content) {
    if (!content || content.length < 2) return;

    let history = JSON.parse(localStorage.getItem('ismidev_history') || '[]');
    
    const newEntry = {
        id: Date.now(),
        type: type,
        content: content, // Simpan konten asli
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Tambahkan ke paling atas dan batasi 20 item saja
    history.unshift(newEntry);
    history = history.slice(0, 20);
    
    localStorage.setItem('ismidev_history', JSON.stringify(history));
}

// 2. Fungsi untuk merender daftar riwayat ke layar
function renderHistory() {
    const container = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('ismidev_history') || '[]');
    
    if (history.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted)">
            <i data-lucide="ghost" size="48"></i>
            <p>Belum ada riwayat aktivitas.</p>
        </div>`;
        lucide.createIcons();
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <span class="history-type">${item.type}</span>
                <div class="history-snippet">${item.content.replace(/</g, "&lt;")}</div>
                <span class="history-time">${item.time}</span>
            </div>
            <div class="history-actions">
                <button class="btn-sec" style="padding:5px 10px;" onclick="copyFromHistory('${item.id}')">
                    <i data-lucide="copy" size="16"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// 3. Fungsi Copy dari riwayat
function copyFromHistory(id) {
    const history = JSON.parse(localStorage.getItem('ismidev_history') || '[]');
    const item = history.find(h => h.id == id);
    if (item) {
        navigator.clipboard.writeText(item.content);
        showToast("Riwayat tersalin!");
    }
}

// 4. Fungsi Hapus Semua
function clearAllHistory() {
    if (confirm("Hapus semua riwayat?")) {
        localStorage.removeItem('ismidev_history');
        renderHistory();
        showToast("Riwayat dibersihkan!");
    }
}
// Inisialisasi 1 baris saat pertama buka
addGenRow();


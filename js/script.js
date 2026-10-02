
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

function updateJsonSizeInfo(text) {
    const sizeInfo = document.getElementById('jsonSizeInfo');
    if (!sizeInfo) return;
    if (!text || text.trim() === '') {
        sizeInfo.innerText = '';
        return;
    }
    const bytes = new Blob([text]).size;
    const formattedSize = bytes > 1024 * 1024 
        ? (bytes / (1024 * 1024)).toFixed(2) + ' MB' 
        : bytes > 1024 
            ? (bytes / 1024).toFixed(1) + ' KB' 
            : bytes + ' B';
    const lines = text.split('\n').length;
    sizeInfo.innerText = `${formattedSize} | ${lines} baris`;
}

function runJsonMagic() {
    const input = document.getElementById('jsonInput');
    const preview = document.getElementById('jsonPreview');
    try {
        let raw = input.value;
        if (!raw || raw.trim() === '') {
            preview.innerHTML = "Result will appear here...";
            updateJsonSizeInfo('');
            return;
        }

        // Auto-repair common syntax mistakes
        let fixed = raw
            .replace(/'/g, '"') // single quotes to double quotes
            .replace(/,\s*([\]}])/g, '$1') // trailing commas
            .replace(/([{,]\s*)([a-zA-Z0-9_\-]+)\s*:/g, '$1"$2":'); // unquoted keys

        const obj = JSON.parse(fixed);
        const formatted = JSON.stringify(obj, null, 4);
        input.value = formatted;
        preview.innerHTML = colorize(obj);
        preview.setAttribute('data-raw', formatted);
        updateJsonSizeInfo(formatted);

        history.push(formatted);
        step++;
        document.getElementById('undoBtn').disabled = false;
        
        // Reset query badge jika sebelumnya ada filter
        const badge = document.getElementById('jsonPathBadge');
        if (badge) badge.style.display = 'none';

        saveToHistory('JSON Beautify', formatted.slice(0, 80));
    } catch(e) { 
        preview.innerHTML = `<span style="color:#ef4444; font-weight:bold;">❌ Syntax Error: ${e.message}</span><br><br><small style="color:var(--text-muted)">Periksa kembali tanda kurung {}, [], atau tanda kutip string Anda.</small>`; 
    }
}

function minifyJson() {
    const input = document.getElementById('jsonInput');
    const preview = document.getElementById('jsonPreview');
    try {
        let raw = input.value;
        if (!raw || raw.trim() === '') return;
        const obj = JSON.parse(raw);
        const minified = JSON.stringify(obj);
        input.value = minified;
        preview.innerHTML = colorize(obj);
        preview.setAttribute('data-raw', minified);
        updateJsonSizeInfo(minified);

        history.push(minified);
        step++;
        document.getElementById('undoBtn').disabled = false;
        showToast("JSON berhasil di-minify!");
    } catch(e) {
        showToast("Error minifying: JSON belum valid!");
    }
}

// FR-1.3: Auto Escape / Unescape
function unescapeJsonInput() {
    const input = document.getElementById('jsonInput');
    let str = input.value.trim();
    if (!str) return;

    try {
        // Cek apakah string diawali dan diakhiri tanda kutip luar seperti di format log
        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
            try {
                const unquoted = JSON.parse(str);
                if (typeof unquoted === 'string') {
                    str = unquoted;
                }
            } catch(err) {}
        }

        // Ganti escaped quotes dan escape slash umum
        str = str
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\//g, '/')
            .replace(/\\\\/g, '\\');

        // Parse dan format
        const obj = JSON.parse(str);
        const formatted = JSON.stringify(obj, null, 4);
        input.value = formatted;
        document.getElementById('jsonPreview').innerHTML = colorize(obj);
        document.getElementById('jsonPreview').setAttribute('data-raw', formatted);
        updateJsonSizeInfo(formatted);

        history.push(formatted);
        step++;
        document.getElementById('undoBtn').disabled = false;
        showToast("JSON Unescaped & Rapi!");
    } catch(e) {
        input.value = str;
        showToast("Karakter unescaped, namun belum menjadi JSON valid.");
    }
}

function escapeJsonInput() {
    const input = document.getElementById('jsonInput');
    let val = input.value.trim();
    if (!val) return;

    try {
        // Jika valid JSON, minify dulu agar string escaped bersih
        try {
            val = JSON.stringify(JSON.parse(val));
        } catch(err) {}

        const escaped = JSON.stringify(val);
        input.value = escaped;
        document.getElementById('jsonPreview').innerText = escaped;
        document.getElementById('jsonPreview').setAttribute('data-raw', escaped);
        updateJsonSizeInfo(escaped);

        history.push(escaped);
        step++;
        document.getElementById('undoBtn').disabled = false;
        showToast("JSON Escaped untuk Payload/String Literal!");
    } catch(e) {
        showToast("Gagal meng-escape JSON!");
    }
}

function clearJsonWorkspace() {
    document.getElementById('jsonInput').value = '';
    const preview = document.getElementById('jsonPreview');
    preview.innerHTML = 'Result will appear here...';
    preview.removeAttribute('data-raw');
    resetJsonPath();
    updateJsonSizeInfo('');
    showToast("Workspace JSON dibersihkan!");
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
        const val = history[step];
        if (val) {
            try {
                const parsed = JSON.parse(val);
                document.getElementById('jsonPreview').innerHTML = colorize(parsed);
                document.getElementById('jsonPreview').setAttribute('data-raw', val);
            } catch(e) {
                document.getElementById('jsonPreview').innerText = val;
            }
            updateJsonSizeInfo(val);
        } else {
            document.getElementById('jsonPreview').innerHTML = "Click Fix to refresh highlight.";
            updateJsonSizeInfo('');
        }
        if(step === 0) document.getElementById('undoBtn').disabled = true;
    }
}

// --- FR-1.1: JSONPath Filter Engine ---
function evaluateJsonPath(data, query) {
    if (!query || query.trim() === '' || query.trim() === '$') return data;
    
    let path = query.trim();
    if (path.startsWith('$')) path = path.slice(1);
    if (path.startsWith('.')) path = path.slice(1);
    
    // Deep scan recursive descent ..prop
    if (path.startsWith('.')) {
        const key = path.replace(/^\.+/, '');
        const results = [];
        function deepScan(node) {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
                node.forEach(item => deepScan(item));
            } else {
                for (const k in node) {
                    if (k === key) results.push(node[k]);
                    deepScan(node[k]);
                }
            }
        }
        deepScan(data);
        return results;
    }

    // Tokenize
    const tokens = [];
    const regex = /([a-zA-Z0-9_\-]+)|(\[\*\]|\*)|(\[\-?\d+\])|(\[\-?\d*:\-?\d*\])|(\[\?\(.*?\)\])|(\['(?:[^'\\]|\\.)*'\]|\["(?:[^"\\]|\\.)*"\])/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
        if (match[1]) tokens.push({ type: 'prop', val: match[1] });
        else if (match[2]) tokens.push({ type: 'wildcard' });
        else if (match[3]) tokens.push({ type: 'index', val: parseInt(match[3].replace(/[\[\]]/g, '')) });
        else if (match[4]) tokens.push({ type: 'slice', val: match[4].replace(/[\[\]]/g, '') });
        else if (match[5]) tokens.push({ type: 'filter', val: match[5].replace(/^\[\?\(|\)\]$/g, '') });
        else if (match[6]) tokens.push({ type: 'prop', val: match[6].replace(/^\[['"]|['"]\]$/g, '') });
    }

    if (tokens.length === 0) return data;

    let currentNodes = [data];

    for (const token of tokens) {
        let nextNodes = [];
        for (const node of currentNodes) {
            if (node === null || node === undefined) continue;

            if (token.type === 'prop') {
                if (typeof node === 'object' && token.val in node) {
                    nextNodes.push(node[token.val]);
                }
            } else if (token.type === 'index') {
                if (Array.isArray(node)) {
                    let idx = token.val;
                    if (idx < 0) idx = node.length + idx;
                    if (idx >= 0 && idx < node.length) {
                        nextNodes.push(node[idx]);
                    }
                }
            } else if (token.type === 'wildcard') {
                if (Array.isArray(node)) {
                    nextNodes.push(...node);
                } else if (typeof node === 'object') {
                    nextNodes.push(...Object.values(node));
                }
            } else if (token.type === 'slice') {
                if (Array.isArray(node)) {
                    const parts = token.val.split(':');
                    const start = parts[0] ? parseInt(parts[0]) : 0;
                    const end = parts[1] ? parseInt(parts[1]) : node.length;
                    nextNodes.push(...node.slice(start, end));
                }
            } else if (token.type === 'filter') {
                if (Array.isArray(node)) {
                    node.forEach(item => {
                        try {
                            const expr = token.val.trim();
                            const filterMatch = expr.match(/^@\.([a-zA-Z0-9_\-]+)\s*(==|===|!=|!==|>|>=|<|<=)\s*(.+)$/);
                            if (filterMatch) {
                                const [, fKey, op, fValRaw] = filterMatch;
                                let fVal = fValRaw.trim();
                                if ((fVal.startsWith('"') && fVal.endsWith('"')) || (fVal.startsWith("'") && fVal.endsWith("'"))) {
                                    fVal = fVal.slice(1, -1);
                                } else if (fVal === 'true') fVal = true;
                                else if (fVal === 'false') fVal = false;
                                else if (!isNaN(fVal)) fVal = Number(fVal);

                                const itemVal = item ? item[fKey] : undefined;
                                let matchCondition = false;
                                if (op === '==' || op === '===') matchCondition = itemVal === fVal;
                                else if (op === '!=' || op === '!==') matchCondition = itemVal !== fVal;
                                else if (op === '>') matchCondition = itemVal > fVal;
                                else if (op === '>=') matchCondition = itemVal >= fVal;
                                else if (op === '<') matchCondition = itemVal < fVal;
                                else if (op === '<=') matchCondition = itemVal <= fVal;
                                if (matchCondition) nextNodes.push(item);
                            } else if (expr.startsWith('@.')) {
                                const propName = expr.slice(2).trim();
                                if (item && item[propName] !== undefined && item[propName] !== false && item[propName] !== null) {
                                    nextNodes.push(item);
                                }
                            }
                        } catch(err){}
                    });
                }
            }
        }
        currentNodes = nextNodes;
    }

    if (currentNodes.length === 1) return currentNodes[0];
    return currentNodes;
}

function applyJsonPath() {
    const input = document.getElementById('jsonInput').value;
    const query = document.getElementById('jsonPathQuery').value;
    const preview = document.getElementById('jsonPreview');
    const badge = document.getElementById('jsonPathBadge');

    if (!input || input.trim() === '') {
        showToast("Masukkan JSON terlebih dahulu!");
        return;
    }

    if (!query || query.trim() === '') {
        resetJsonPath();
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const result = evaluateJsonPath(parsed, query);

        let matchCount = 0;
        if (Array.isArray(result)) {
            matchCount = result.length;
        } else if (result !== undefined && result !== null) {
            matchCount = 1;
        }

        badge.style.display = 'inline-flex';
        if (matchCount > 0) {
            badge.className = 'badge badge-success';
            badge.innerText = `${matchCount} MATCH${matchCount > 1 ? 'ES' : ''}`;
            preview.innerHTML = colorize(result);
            preview.setAttribute('data-raw', JSON.stringify(result, null, 4));
            showToast(`JSONPath menemukan ${matchCount} node!`);
        } else {
            badge.className = 'badge badge-danger';
            badge.innerText = '0 MATCH';
            preview.innerHTML = `<span style="color:#ef4444">⚠️ Tidak ada node yang cocok dengan JSONPath: "${query}"</span>`;
            preview.removeAttribute('data-raw');
        }
    } catch(e) {
        badge.style.display = 'inline-flex';
        badge.className = 'badge badge-danger';
        badge.innerText = 'QUERY ERROR';
        preview.innerHTML = `<span style="color:#ef4444">❌ Error: ${e.message}</span>`;
    }
}

function resetJsonPath() {
    document.getElementById('jsonPathQuery').value = '';
    const badge = document.getElementById('jsonPathBadge');
    if (badge) badge.style.display = 'none';

    const input = document.getElementById('jsonInput').value;
    const preview = document.getElementById('jsonPreview');
    if (input && input.trim() !== '') {
        try {
            const parsed = JSON.parse(input);
            preview.innerHTML = colorize(parsed);
            preview.setAttribute('data-raw', JSON.stringify(parsed, null, 4));
        } catch(e) {}
    }
}

// --- FR-1.2: JSON Schema Contract Validator ---
function toggleSchemaValidator() {
    const body = document.getElementById('schemaValidatorBody');
    const icon = document.getElementById('schemaToggleIcon');
    if (body.style.display === 'none' || !body.style.display) {
        body.style.display = 'block';
        if (icon) icon.setAttribute('data-lucide', 'chevron-up');
    } else {
        body.style.display = 'none';
        if (icon) icon.setAttribute('data-lucide', 'chevron-down');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

const schemaTemplates = {
    user: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "UserProfileContract",
        "type": "object",
        "required": ["id", "nama", "email", "isActive", "noHp"],
        "properties": {
            "id": { "type": "integer", "minimum": 1 },
            "nama": { "type": "string", "minLength": 3 },
            "email": { "type": "string", "pattern": "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$" },
            "isActive": { "type": "boolean" },
            "noHp": { "type": "string", "pattern": "^08[0-9]{8,11}$" },
            "roles": { "type": "array", "items": { "type": "string" } }
        }
    },
    api: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "ApiResponseEnvelope",
        "type": "object",
        "required": ["statusCode", "success", "message", "data"],
        "properties": {
            "statusCode": { "type": "integer", "enum": [200, 201, 400, 401, 403, 404, 500] },
            "success": { "type": "boolean" },
            "message": { "type": "string" },
            "data": { "type": ["object", "array"] }
        }
    },
    product: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "ECommerceProductContract",
        "type": "object",
        "required": ["productId", "title", "price", "stock"],
        "properties": {
            "productId": { "type": "string", "minLength": 4 },
            "title": { "type": "string", "minLength": 2 },
            "price": { "type": "number", "minimum": 0 },
            "stock": { "type": "integer", "minimum": 0 },
            "tags": { "type": "array", "items": { "type": "string" } }
        }
    }
};

function loadSchemaPreset(key) {
    if (!key || !schemaTemplates[key]) return;
    document.getElementById('schemaInput').value = JSON.stringify(schemaTemplates[key], null, 4);
    showToast(`Template skema '${key.toUpperCase()}' dimuat!`);
}

function validateJsonSchema(data, schema, currentPath = '$') {
    const errors = [];
    if (!schema || typeof schema !== 'object') return errors;

    // Type check
    if (schema.type) {
        const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
        let actualType = typeof data;
        if (data === null) actualType = 'null';
        else if (Array.isArray(data)) actualType = 'array';
        else if (actualType === 'number') {
            actualType = Number.isInteger(data) ? 'integer' : 'number';
        }

        const isMatch = allowedTypes.some(t => {
            if (t === 'number') return actualType === 'number' || actualType === 'integer';
            return actualType === t;
        });

        if (!isMatch) {
            errors.push({
                path: currentPath,
                rule: 'type',
                message: `Tipe data salah: diharapkan <code>${allowedTypes.join(' | ')}</code>, namun menerima <code>${actualType}</code>`
            });
            return errors;
        }
    }

    // Required check for objects
    if (schema.required && Array.isArray(schema.required) && typeof data === 'object' && data !== null && !Array.isArray(data)) {
        for (const reqKey of schema.required) {
            if (!(reqKey in data)) {
                errors.push({
                    path: currentPath === '$' ? `$.${reqKey}` : `${currentPath}.${reqKey}`,
                    rule: 'required',
                    message: `Properti wajib <code>${reqKey}</code> hilang pada data JSON`
                });
            }
        }
    }

    // Properties check for objects
    if (schema.properties && typeof data === 'object' && data !== null && !Array.isArray(data)) {
        for (const propKey in schema.properties) {
            if (propKey in data) {
                const subErrors = validateJsonSchema(data[propKey], schema.properties[propKey], currentPath === '$' ? `$.${propKey}` : `${currentPath}.${propKey}`);
                errors.push(...subErrors);
            }
        }
    }

    // Items check for arrays
    if (schema.items && Array.isArray(data)) {
        data.forEach((item, idx) => {
            const subErrors = validateJsonSchema(item, schema.items, `${currentPath}[${idx}]`);
            errors.push(...subErrors);
        });
    }

    // String constraints
    if (typeof data === 'string') {
        if (typeof schema.minLength === 'number' && data.length < schema.minLength) {
            errors.push({
                path: currentPath,
                rule: 'minLength',
                message: `Panjang string (${data.length}) kurang dari minimum (${schema.minLength})`
            });
        }
        if (typeof schema.maxLength === 'number' && data.length > schema.maxLength) {
            errors.push({
                path: currentPath,
                rule: 'maxLength',
                message: `Panjang string (${data.length}) melebihi maksimum (${schema.maxLength})`
            });
        }
        if (schema.pattern) {
            try {
                const reg = new RegExp(schema.pattern);
                if (!reg.test(data)) {
                    errors.push({
                        path: currentPath,
                        rule: 'pattern',
                        message: `String tidak memenuhi pola regex format <code>${schema.pattern}</code>`
                    });
                }
            } catch(e){}
        }
    }

    // Number constraints
    if (typeof data === 'number') {
        if (typeof schema.minimum === 'number' && data < schema.minimum) {
            errors.push({
                path: currentPath,
                rule: 'minimum',
                message: `Nilai (${data}) kurang dari batas minimum (${schema.minimum})`
            });
        }
        if (typeof schema.maximum === 'number' && data > schema.maximum) {
            errors.push({
                path: currentPath,
                rule: 'maximum',
                message: `Nilai (${data}) melebihi batas maksimum (${schema.maximum})`
            });
        }
    }

    // Enum check
    if (schema.enum && Array.isArray(schema.enum)) {
        if (!schema.enum.includes(data)) {
            errors.push({
                path: currentPath,
                rule: 'enum',
                message: `Nilai <code>${data}</code> tidak diizinkan. Pilihan yang valid: [${schema.enum.join(', ')}]`
            });
        }
    }

    return errors;
}

function validateCurrentJsonSchema() {
    const jsonStr = document.getElementById('jsonInput').value.trim();
    const schemaStr = document.getElementById('schemaInput').value.trim();
    const statusBadge = document.getElementById('schemaStatusBadge');
    const resultBox = document.getElementById('schemaResultBox');
    const summaryText = document.getElementById('schemaSummaryText');

    if (!jsonStr) {
        showToast("Masukkan payload JSON di editor utama!");
        return;
    }
    if (!schemaStr) {
        showToast("Masukkan skema kontrak di kolom skema!");
        return;
    }

    let jsonData, schemaData;
    try {
        jsonData = JSON.parse(jsonStr);
    } catch(e) {
        showToast("Payload JSON tidak valid!");
        statusBadge.className = 'badge badge-danger';
        statusBadge.innerText = 'INVALID JSON';
        resultBox.innerHTML = `<span style="color:#ef4444">❌ Payload JSON di editor tidak valid: ${e.message}</span>`;
        return;
    }

    try {
        schemaData = JSON.parse(schemaStr);
    } catch(e) {
        showToast("Format JSON Schema tidak valid!");
        statusBadge.className = 'badge badge-danger';
        statusBadge.innerText = 'INVALID SCHEMA';
        resultBox.innerHTML = `<span style="color:#ef4444">❌ Format JSON Schema tidak valid: ${e.message}</span>`;
        return;
    }

    const errors = validateJsonSchema(jsonData, schemaData);

    if (errors.length === 0) {
        statusBadge.className = 'badge badge-success';
        statusBadge.innerText = 'CONTRACT VALID';
        summaryText.innerText = '0 Pelanggaran';
        resultBox.innerHTML = `
            <div style="padding:15px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.3); border-radius:8px; color:#4ade80;">
                <div style="display:flex; align-items:center; gap:8px; font-weight:700; margin-bottom:6px;">
                    <i data-lucide="check-circle-2"></i> SKEMA KONTRAK TERPENUHI (VALID)
                </div>
                <div style="font-size:0.82rem; color:var(--text-main);">
                    Seluruh struktur field, tipe data, dan aturan validasi sesuai dengan spesifikasi skema kontrak API.
                </div>
            </div>
        `;
        showToast("Kontrak JSON valid!");
    } else {
        statusBadge.className = 'badge badge-danger';
        statusBadge.innerText = `INVALID (${errors.length} ERRORS)`;
        summaryText.innerText = `${errors.length} Pelanggaran ditemukan`;
        
        let tableRows = errors.map(err => `
            <tr>
                <td><code>${err.path}</code></td>
                <td><span class="badge badge-neutral">${err.rule}</span></td>
                <td>${err.message}</td>
            </tr>
        `).join('');

        resultBox.innerHTML = `
            <div style="margin-bottom:10px; color:#f87171; font-weight:700; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-triangle"></i> Ditemukan ${errors.length} ketidaksesuaian kontrak:
            </div>
            <table class="schema-error-table">
                <thead>
                    <tr>
                        <th style="width:25%;">Path Node</th>
                        <th style="width:18%;">Rule</th>
                        <th>Keterangan Pelanggaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
        showToast(`Ditemukan ${errors.length} error skema!`);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    saveToHistory('Schema Validation', `Errors: ${errors.length}`);
}

function clearSchemaForm() {
    document.getElementById('schemaInput').value = '';
    document.getElementById('schemaPresets').value = '';
    const badge = document.getElementById('schemaStatusBadge');
    badge.className = 'badge badge-neutral';
    badge.innerText = 'Not Validated';
    document.getElementById('schemaSummaryText').innerText = '';
    document.getElementById('schemaResultBox').innerHTML = `
        <div style="color:var(--text-muted); font-size:0.85rem; padding:10px;">
            Tempel skema kontrak di sebelah kiri atau pilih template, lalu klik <strong>"Validate Contract"</strong> untuk menguji kesesuaian payload JSON Anda.
        </div>
    `;
    showToast("Form skema dibersihkan!");
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

// function copyValue(id) {
//     navigator.clipboard.writeText(document.getElementById(id).value);
//     showToast("Copied!");
// }

// --- UNIVERSAL UTILS ---

// Fungsi Copy yang bisa handle Textarea maupun DIV
function copyValue(id) {
    const el = document.getElementById(id);
    let textToCopy = "";

    if (!el) return;

    // Cek apakah element itu textarea/input atau div biasa
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        textToCopy = el.value;
    } else {
        // Jika div (seperti preview box), ambil innerText
        // Atau ambil data-raw jika ada (untuk JSON/Lorem yang ada format HTML-nya)
        textToCopy = el.getAttribute('data-raw') || el.innerText;
    }

    if (!textToCopy || textToCopy === "Result..." || textToCopy.includes("akan muncul di sini")) {
        showToast("Tidak ada teks untuk disalin!");
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Tersalin ke clipboard!");
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
    });
}

// Fungsi Clear Form Universal
function clearForm(inputId, previewId) {
    if (confirm("Bersihkan semua input dan hasil?")) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        if (input) input.value = "";
        if (preview) {
            if (preview.tagName === 'TEXTAREA') {
                preview.value = "";
            } else {
                preview.innerHTML = "Hasil akan muncul di sini...";
                preview.removeAttribute('data-raw');
            }
        }
        
        // Reset statistik jika di halaman Text Utils
        if (inputId === 'textInput') {
            document.getElementById('wordCount').innerText = "0";
            document.getElementById('charCount').innerText = "0";
        }
        
        showToast("Form dibersihkan!");
    }
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

// =========================================================
// MODULE 2: QA DATA & BOUNDARY GENERATOR (ENHANCEMENT)
// =========================================================

// Data Dummy Master
const dummySource = {
    name: ["John Doe", "Jane Smith", "Michael Brown", "Sarah Wilson", "David Taylor", "Emma Watson"],
    name_id: [
        "Bambang Pamungkas", "Dewi Sartika", "Siti Aminah", "Budi Santoso", 
        "Rizky Ramadhan", "Agus Setiawan", "Eko Prasetyo", "Putri Rahayu", 
        "Indah Permatasari", "Bayu Pratama", "Dimas Aditya", "Tri Wahyuni",
        "Ahmad Fauzi", "Dian Sastrowardoyo", "Rina Marlina", "Hendra Gunawan"
    ],
    email: ["admin@test.com", "user@ismidev.pro", "tester@qa.id", "dev@tech.io", "qa.automation@corp.net", "staging.user@app.test"],
    city: ["Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Semarang", "Makassar", "Denpasar", "Malang", "Bekasi"],
    address: [
        "Jl. Jend. Sudirman No. 45, RT 01/RW 02",
        "Jl. M.H. Thamrin No. 12, RT 03/RW 05",
        "Jl. Gatot Subroto No. 88, RT 02/RW 04",
        "Jl. Asia Afrika No. 10, RT 04/RW 01",
        "Jl. Diponegoro No. 23, RT 05/RW 06"
    ],
    status: ["Active", "Inactive", "Pending", "Suspended", "Verified", "Blocked"]
};

// --- FR-2.1: Indonesian Identity Generators ---

// 1. NIK Generator (16 Digit Valid Structure)
function generateIndonesianNik() {
    const provinces = [
        { code: "31", name: "DKI Jakarta" },
        { code: "32", name: "Jawa Barat" },
        { code: "33", name: "Jawa Tengah" },
        { code: "34", name: "DI Yogyakarta" },
        { code: "35", name: "Jawa Timur" },
        { code: "12", name: "Sumatera Utara" },
        { code: "13", name: "Sumatera Barat" },
        { code: "16", name: "Sumatera Selatan" },
        { code: "51", name: "Bali" },
        { code: "73", name: "Sulawesi Selatan" }
    ];
    const prov = provinces[Math.floor(Math.random() * provinces.length)];
    const regency = String(Math.floor(Math.random() * 70) + 1).padStart(2, '0');
    const district = String(Math.floor(Math.random() * 15) + 1).padStart(2, '0');
    
    // Gender & Birth Date (female day is +40)
    const isFemale = Math.random() > 0.5;
    let day = Math.floor(Math.random() * 28) + 1;
    const realDay = day;
    if (isFemale) day += 40;
    const dayStr = String(day).padStart(2, '0');
    
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthYear = Math.floor(Math.random() * 35) + 1970; // 1970 - 2005
    const yearStr = String(birthYear).slice(-2);
    
    const sequence = String(Math.floor(Math.random() * 25) + 1).padStart(4, '0');
    const nik = `${prov.code}${regency}${district}${dayStr}${month}${yearStr}${sequence}`;
    
    return {
        nik,
        province: prov.name,
        gender: isFemale ? "Perempuan" : "Laki-laki",
        dob: `${String(realDay).padStart(2, '0')}/${month}/${birthYear}`
    };
}

// 2. NPWP Generator (15-Digit Format Standard & 16-Digit NIK-NPWP)
function generateIndonesianNpwp(formatted = true) {
    const typePrefix = ["01", "02", "03", "07", "08", "09"][Math.floor(Math.random() * 6)];
    const part1 = String(Math.floor(Math.random() * 900) + 100);
    const part2 = String(Math.floor(Math.random() * 900) + 100);
    const checkDigit = String(Math.floor(Math.random() * 10));
    const kpp = String(Math.floor(Math.random() * 800) + 100);
    const branch = "000";
    
    if (formatted) {
        return `${typePrefix}.${part1}.${part2}.${checkDigit}-${kpp}.${branch}`;
    }
    return `${typePrefix}${part1}${part2}${checkDigit}${kpp}${branch}`;
}

// 3. Indonesian Phone Number Generator (with Real Carrier Prefixes)
function generateIndonesianPhone() {
    const carriers = [
        { name: "Telkomsel", prefixes: ["0811", "0812", "0813", "0821", "0822", "0852", "0853"] },
        { name: "Indosat Ooredoo", prefixes: ["0814", "0815", "0816", "0855", "0856", "0857", "0858"] },
        { name: "XL Axiata", prefixes: ["0817", "0818", "0819", "0859", "0877", "0878"] },
        { name: "Tri (3)", prefixes: ["0895", "0896", "0897", "0898", "0899"] },
        { name: "Smartfren", prefixes: ["0881", "0882", "0883", "0884", "0887", "0888"] }
    ];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const prefix = carrier.prefixes[Math.floor(Math.random() * carrier.prefixes.length)];
    const suffix = String(Math.floor(Math.random() * 9000000) + 1000000);
    return {
        number: `${prefix}${suffix}`,
        operator: carrier.name
    };
}

// 4. Full Indonesian Identity Profile (KTP Mock)
function generateIndonesianIdentity() {
    const nikInfo = generateIndonesianNik();
    const phoneInfo = generateIndonesianPhone();
    const npwp = generateIndonesianNpwp(true);
    
    const isFemale = nikInfo.gender === "Perempuan";
    const femaleNames = dummySource.name_id.filter((_, i) => i % 2 !== 0);
    const maleNames = dummySource.name_id.filter((_, i) => i % 2 === 0);
    const name = isFemale 
        ? femaleNames[Math.floor(Math.random() * femaleNames.length)] 
        : maleNames[Math.floor(Math.random() * maleNames.length)];
        
    const cleanUser = name.toLowerCase().replace(/[^a-z]/g, '.') + Math.floor(Math.random() * 90 + 10);
    const email = `${cleanUser}@example.com`;
    const address = dummySource.address[Math.floor(Math.random() * dummySource.address.length)];
    const city = dummySource.city[Math.floor(Math.random() * dummySource.city.length)];
    
    return {
        nama: name,
        nik: nikInfo.nik,
        npwp: npwp,
        jenisKelamin: nikInfo.gender,
        tanggalLahir: nikInfo.dob,
        provinsi: nikInfo.province,
        alamat: address,
        kota: city,
        noHp: phoneInfo.number,
        operator: phoneInfo.operator,
        email: email,
        agama: "Islam",
        statusPerkawinan: Math.random() > 0.4 ? "Kawin" : "Belum Kawin",
        pekerjaan: "Karyawan Swasta",
        kewarganegaraan: "WNI"
    };
}

// Global cached quick mocks
let quickMockData = {
    nik: null,
    npwp: null,
    phone: null,
    identity: null
};

function generateQuickNik() {
    const data = generateIndonesianNik();
    quickMockData.nik = data;
    document.getElementById('quickNikVal').innerText = data.nik;
    document.getElementById('quickNikMeta').innerText = `${data.province} • ${data.gender} (${data.dob})`;
    showToast("NIK Indonesia baru dibuat!");
}

function generateQuickNpwp() {
    const val = generateIndonesianNpwp(true);
    quickMockData.npwp = val;
    document.getElementById('quickNpwpVal').innerText = val;
    document.getElementById('quickNpwpMeta').innerText = `15 Digit Standar DJP`;
    showToast("NPWP baru dibuat!");
}

function generateQuickPhone() {
    const data = generateIndonesianPhone();
    quickMockData.phone = data;
    document.getElementById('quickPhoneVal').innerText = data.number;
    document.getElementById('quickPhoneMeta').innerText = `Operator: ${data.operator}`;
    showToast("Nomor HP baru dibuat!");
}

function generateQuickIdentity() {
    const data = generateIndonesianIdentity();
    quickMockData.identity = data;
    document.getElementById('quickIdentityVal').innerText = data.nama;
    document.getElementById('quickIdentityMeta').innerText = `${data.nik} • ${data.kota}`;
    showToast("Profil KTP lengkap baru dibuat!");
}

function copyQuickMock(type) {
    let text = "";
    if (type === 'nik') text = quickMockData.nik ? quickMockData.nik.nik : document.getElementById('quickNikVal').innerText;
    else if (type === 'npwp') text = quickMockData.npwp || document.getElementById('quickNpwpVal').innerText;
    else if (type === 'phone') text = quickMockData.phone ? quickMockData.phone.number : document.getElementById('quickPhoneVal').innerText;
    else if (type === 'identity') text = quickMockData.identity ? JSON.stringify(quickMockData.identity, null, 4) : "";

    if (!text || text === "-") {
        showToast("Klik 'Generate' terlebih dahulu!");
        return;
    }
    navigator.clipboard.writeText(text);
    showToast(`${type.toUpperCase()} disalin ke clipboard!`);
}

function insertMockToJson(type) {
    let payload = null;
    if (type === 'nik') {
        if (!quickMockData.nik) generateQuickNik();
        payload = { nik: quickMockData.nik.nik, province: quickMockData.nik.province, dob: quickMockData.nik.dob };
    } else if (type === 'npwp') {
        if (!quickMockData.npwp) generateQuickNpwp();
        payload = { npwp: quickMockData.npwp };
    } else if (type === 'phone') {
        if (!quickMockData.phone) generateQuickPhone();
        payload = { noHp: quickMockData.phone.number, operator: quickMockData.phone.operator };
    } else if (type === 'identity') {
        if (!quickMockData.identity) generateQuickIdentity();
        payload = quickMockData.identity;
    }

    if (!payload) return;

    const jsonInput = document.getElementById('jsonInput');
    let current = jsonInput.value.trim();
    if (!current) {
        jsonInput.value = JSON.stringify(payload, null, 4);
    } else {
        try {
            const parsed = JSON.parse(current);
            if (Array.isArray(parsed)) {
                parsed.push(payload);
                jsonInput.value = JSON.stringify(parsed, null, 4);
            } else if (typeof parsed === 'object') {
                Object.assign(parsed, payload);
                jsonInput.value = JSON.stringify(parsed, null, 4);
            }
        } catch(e) {
            jsonInput.value = current + "\n\n" + JSON.stringify(payload, null, 4);
        }
    }
    runJsonMagic();
    openTab('jsonPage', document.querySelector('.tab-btn'));
    showToast("Data mock disisipkan ke JSON Editor!");
}

// Fungsi Tambah Baris Konfigurasi Field Generator
function addGenRow(defaultKey = '', defaultType = 'name_id') {
    const container = document.getElementById('genConfig');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'gen-row';
    div.innerHTML = `
        <div class="gen-inputs">
            <input type="text" placeholder="Key (misal: nik)" class="gen-key-input" value="${defaultKey}">
            <select class="gen-type-input">
                <option value="name_id" ${defaultType === 'name_id' ? 'selected' : ''}>Nama Indonesia (Lokal)</option>
                <option value="nik" ${defaultType === 'nik' ? 'selected' : ''}>NIK Indonesia (16-Digit)</option>
                <option value="npwp" ${defaultType === 'npwp' ? 'selected' : ''}>NPWP Indonesia (Format DJP)</option>
                <option value="phone" ${defaultType === 'phone' ? 'selected' : ''}>No. HP Indonesia (08xx)</option>
                <option value="email" ${defaultType === 'email' ? 'selected' : ''}>Email</option>
                <option value="city" ${defaultType === 'city' ? 'selected' : ''}>Kota Indonesia</option>
                <option value="address" ${defaultType === 'address' ? 'selected' : ''}>Alamat Indonesia</option>
                <option value="name" ${defaultType === 'name' ? 'selected' : ''}>Nama Global / Western</option>
                <option value="number" ${defaultType === 'number' ? 'selected' : ''}>Angka Acak (1-1000)</option>
                <option value="boolean" ${defaultType === 'boolean' ? 'selected' : ''}>Boolean (true/false)</option>
                <option value="status" ${defaultType === 'status' ? 'selected' : ''}>Status (Active/Inactive)</option>
                <option value="uuid" ${defaultType === 'uuid' ? 'selected' : ''}>UUID v4</option>
                <option value="date" ${defaultType === 'date' ? 'selected' : ''}>Tanggal ISO (YYYY-MM-DD)</option>
            </select>
        </div>
        <button class="btn-del" onclick="this.parentElement.remove()" title="Hapus field"><i data-lucide="trash-2" size="16"></i></button>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function loadDefaultGenFields() {
    const container = document.getElementById('genConfig');
    if (!container) return;
    container.innerHTML = '';
    addGenRow('nik', 'nik');
    addGenRow('namaLengkap', 'name_id');
    addGenRow('email', 'email');
    addGenRow('noHp', 'phone');
    addGenRow('npwp', 'npwp');
    addGenRow('kota', 'city');
    addGenRow('statusAkun', 'status');
    showToast("Template Field QA Indonesia dimuat!");
}

function generateUuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Fungsi Generate JSON
function generateDummyJSON() {
    const rows = document.querySelectorAll('.gen-row');
    const count = parseInt(document.getElementById('genCount').value) || 1;
    const result = [];

    for (let i = 0; i < count; i++) {
        let obj = {};
        rows.forEach(row => {
            const key = row.querySelector('.gen-key-input').value.trim() || "field_" + Math.random().toString(36).substring(7);
            const type = row.querySelector('.gen-type-input').value;
            
            let value;
            if (type === 'number') {
                value = Math.floor(Math.random() * 1000) + 1;
            } else if (type === 'boolean') {
                value = Math.random() > 0.5;
            } else if (type === 'nik') {
                value = generateIndonesianNik().nik;
            } else if (type === 'npwp') {
                value = generateIndonesianNpwp(true);
            } else if (type === 'phone') {
                value = generateIndonesianPhone().number;
            } else if (type === 'uuid') {
                value = generateUuidV4();
            } else if (type === 'date') {
                const d = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
                value = d.toISOString().split('T')[0];
            } else {
                const source = dummySource[type] || dummySource.name;
                value = source[Math.floor(Math.random() * source.length)];
            }
            obj[key] = value;
        });
        result.push(obj);
    }

    const finalOutput = count === 1 ? result[0] : result;
    const preview = document.getElementById('genPreview');
    const formatted = JSON.stringify(finalOutput, null, 4);
    preview.innerHTML = colorize(finalOutput);
    preview.setAttribute('data-raw', formatted);
    showToast(`Berhasil generate ${count} record!`);
    saveToHistory('Dummy Generator', `Generated ${count} records`);
}

function sendGenToJsonEditor() {
    const preview = document.getElementById('genPreview');
    const raw = preview.getAttribute('data-raw');
    if (!raw || raw.includes("akan muncul di sini")) {
        showToast("Generate data terlebih dahulu!");
        return;
    }
    const jsonInput = document.getElementById('jsonInput');
    jsonInput.value = raw;
    runJsonMagic();
    // Switch tab to jsonPage
    const jsonTabBtn = document.querySelector(".tab-btn[onclick*='jsonPage']");
    openTab('jsonPage', jsonTabBtn || document.querySelector('.tab-btn'));
    showToast("Data dikirim ke Smart JSON Editor!");
}

// --- FR-2.2: Boundary Presets & Security Test Vectors ---
function switchPresetTab(tabName, btn) {
    document.querySelectorAll('.qa-preset-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.preset-content').forEach(c => c.style.display = 'none');
    
    btn.classList.add('active');
    const target = document.getElementById(`presetTab-${tabName}`);
    if (target) target.style.display = 'block';
}

function copyPresetVal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.getAttribute('data-raw') || el.innerText;
    navigator.clipboard.writeText(text);
    showToast("Preset tersalin ke clipboard!");
}

function generateCustomLengthString() {
    const input = document.getElementById('customLenInput');
    const len = parseInt(input.value) || 512;
    const pattern = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
    let str = "";
    for (let i = 0; i < len; i++) {
        str += pattern.charAt(i % pattern.length);
    }
    navigator.clipboard.writeText(str);
    showToast(`${len} karakter string tanpa spasi berhasil disalin!`);
}

function initBoundaryPresets() {
    // 255 chars
    const b255El = document.getElementById('bound255');
    if (b255El) {
        const str255 = "A1b2C3d4E5f6G7h8I9j0_K1l2M3n4O5p6Q7r8S9t0_U1v2W3x4Y5z6A7b8C9d0_E1f2G3h4I5j6K7l8M9n0_O1p2Q3r4S5t6U7v8W9x0_Y1z2A3b4C5d6E7f8G9h0_I1j2K3l4M5n6O7p8Q9r0_S1t2U3v4W5x6Y7z8A9b0_C1d2E3f4G5h6I7j8K9l0_M1n2O3p4Q5r6S7t8U9v0_W1x2Y3z4A5b6C7d8E9f0_G1h2I3j4K5l6M7n8O9p0_Q1r2S3t4U5v6W7x8";
        b255El.innerText = str255.slice(0, 45) + "... (" + str255.length + " chars)";
        b255El.setAttribute('data-raw', str255);
    }

    // 1000 chars
    const b1000El = document.getElementById('bound1000');
    if (b1000El) {
        let str1000 = "";
        const base = "QA_BOUNDARY_TEST_1000_CHARS_STRING_LIMIT_TESTING_PAYLOAD_";
        while (str1000.length < 1000) str1000 += base;
        str1000 = str1000.slice(0, 1000);
        b1000El.innerText = str1000.slice(0, 45) + "... (" + str1000.length + " chars)";
        b1000El.setAttribute('data-raw', str1000);
    }

    // 5000 chars
    const b5000El = document.getElementById('bound5000');
    if (b5000El) {
        let str5000 = "";
        const base5 = "LONG_PAYLOAD_5000_BYTES_TESTING_DATA_EXTREME_STRESS_";
        while (str5000.length < 5000) str5000 += base5;
        str5000 = str5000.slice(0, 5000);
        b5000El.innerText = str5000.slice(0, 45) + "... (" + str5000.length + " chars)";
        b5000El.setAttribute('data-raw', str5000);
    }

    // Unicode & Zero Width presets
    const zalgo = "Z͑ͫ̓ͪ̂ͫ̽͏͈̙̜͉̞͉A̭̖͍͕͇̰ͫͪ̽ͧͯ̿͜͝Lͨͧͪ͐̽ͽ͏̟͓Gͩͩ́̂O_T̼ͥ̎̿ͯ͒͝EͬͦͩSͪT";
    const zw = "Hidden\u200BZero\u200CWidth\u200DChars\uFEFFTest";
    const multi = "测试_اختبار_тест_ทดสอบ_한국어_🚀";
    const emojis = "👨‍👩‍👧‍👦 🏳️‍🌈 🧑🏽‍💻 🏴‍☠️ 🦾 🫱🏻‍🫲🏿";
    const rtl = "\u202EThis_text_is_reversed_by_RTL_override\u202C";

    const setRaw = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('data-raw', val);
    };

    setRaw('zalgoPreset', zalgo);
    setRaw('zwPreset', zw);
    setRaw('multibytePreset', multi);
    setRaw('emojiPreset', emojis);
    setRaw('rtlPreset', rtl);
    setRaw('xss1', "<script>alert('XSS_TEST')<\/script>");
    setRaw('xss2', '"><img src=x onerror=alert(\'XSS\')>');
    setRaw('sqli1', "' OR '1'='1' -- ");
    setRaw('sqli2', "' UNION SELECT 1, 'admin', null, version() -- ");
    setRaw('traverse1', '../../../../etc/passwd');
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

// --- LOREM IPSUM LOGIC ---
function generateLorem() {
    const count = parseInt(document.getElementById('loremCount').value) || 1;
    const type = document.getElementById('loremType').value;
    const preview = document.getElementById('loremPreview');

    const words = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat"];

    const getSentence = () => {
        let sentence = [];
        const len = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < len; i++) {
            sentence.push(words[Math.floor(Math.random() * words.length)]);
        }
        let s = sentence.join(" ");
        return s.charAt(0).toUpperCase() + s.slice(1) + ".";
    };

    let result = [];

    if (type === 'words') {
        for (let i = 0; i < count; i++) {
            result.push(words[Math.floor(Math.random() * words.length)]);
        }
        preview.innerText = result.join(" ");
    } else if (type === 'sentences') {
        for (let i = 0; i < count; i++) {
            result.push(getSentence());
        }
        preview.innerText = result.join(" ");
    } else {
        // Paragraf
        for (let i = 0; i < count; i++) {
            let p = [];
            const pLen = Math.floor(Math.random() * 3) + 3;
            for (let j = 0; j < pLen; j++) {
                p.push(getSentence());
            }
            result.push(p.join(" "));
        }
        preview.innerHTML = result.map(p => `<p style="margin-bottom:15px">${p}</p>`).join("");
    }
    
    // Simpan ke history jika mau
    saveToHistory('Lorem Generator', `Generated ${count} ${type}`);
}
// Inisialisasi default generator fields
loadDefaultGenFields();

// Inisialisasi boundary presets
initBoundaryPresets();

// Inisialisasi quick mock previews
generateQuickNik();
generateQuickNpwp();
generateQuickPhone();
generateQuickIdentity();

if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.id === 'jsonInput' || activeEl.closest('#jsonPage'))) {
            e.preventDefault();
            runJsonMagic();
        } else if (activeEl && (activeEl.id === 'diffOld' || activeEl.id === 'diffNew')) {
            e.preventDefault();
            compareTexts();
        }
    }
});



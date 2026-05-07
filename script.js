// ─── State ────────────────────────────────────────────────────────────────────
let teamCount = 100;
let categories = [
    { id: 'berat',   name: 'Makanan Berat',  color: '#ff6666', quota: 40 },
    { id: 'ringan',  name: 'Makanan Ringan', color: '#ffcc00', quota: 30 },
    { id: 'minuman', name: 'Minuman',        color: '#00ccff', quota: 30 },
];
let teams = [];
let catIdCounter = 10; // for generating new unique category IDs

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
    const grid = document.getElementById('teamGrid');
    teams = [];
    grid.innerHTML = '';

    for (let i = 1; i <= teamCount; i++) {
        teams.push({ id: i, name: `Team ${i}`, category: null, tenantSlot: null });

        const card = document.createElement('div');
        card.className = 'team-card';
        card.id = `card-${i}`;
        card.innerHTML = `
            <div class="team-header">
                <input type="text" class="team-name-input" value="Team ${i}" data-id="${i}" onchange="updateName(${i}, this.value)">
                <span class="team-number">#${i}</span>
            </div>
            <div class="category-badge" id="badge-${i}">
                Wait for assignment
            </div>
        `;
        grid.appendChild(card);
    }

    document.getElementById('headerSubtitle').textContent = `Assign Categories to ${teamCount} Teams`;
    updateStats();

    // Event listeners (attach only once on first init)
    if (!window._listenersAttached) {
        document.getElementById('randomizeBtn').addEventListener('click', startRandomization);
        document.getElementById('resetBtn').addEventListener('click', reset);
        document.getElementById('exportBtn').addEventListener('click', exportToExcel);
        document.getElementById('editSettingsBtn').addEventListener('click', openSettings);
        document.getElementById('modalCloseBtn').addEventListener('click', closeSettings);
        document.getElementById('modalCancelBtn').addEventListener('click', closeSettings);
        document.getElementById('modalSaveBtn').addEventListener('click', saveSettings);
        document.getElementById('addCatBtn').addEventListener('click', addNewCategory);

        // Close modal on overlay click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settingsModal')) closeSettings();
        });

        // Live quota counter
        document.getElementById('settingTeamCount').addEventListener('input', updateQuotaHint);

        window._listenersAttached = true;
    }
}

// ─── Team name update ─────────────────────────────────────────────────────────
function updateName(id, newName) {
    const team = teams.find(t => t.id === id);
    if (team) team.name = newName;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
    const container = document.getElementById('statsContainer');
    container.innerHTML = '';

    categories.forEach(cat => {
        const count = teams.filter(t => t.category && t.category.id === cat.id).length;
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.borderColor = `${cat.color}44`;
        card.innerHTML = `
            <h3 style="color:${cat.color}aa">${cat.name}</h3>
            <span style="color:${cat.color}">${count}</span>
            <small class="quota-label">/ ${cat.quota}</small>
        `;
        container.appendChild(card);
    });
}

// ─── Randomize ────────────────────────────────────────────────────────────────
async function startRandomization() {
    const btn = document.getElementById('randomizeBtn');
    btn.disabled = true;

    // Reset all badges
    teams.forEach(t => t.category = null);
    document.querySelectorAll('.category-badge').forEach(el => {
        el.className = 'category-badge';
        el.removeAttribute('style');
        el.innerText = 'Rolling...';
    });

    document.body.classList.add('shuffling');

    // Build deck from quotas
    let deck = [];
    categories.forEach(cat => {
        for (let i = 0; i < cat.quota; i++) deck.push(cat);
    });

    // Fisher-Yates Shuffle — categories
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Fisher-Yates Shuffle — slot numbers (1..N) independently
    let slotNumbers = Array.from({ length: teamCount }, (_, i) => i + 1);
    for (let i = slotNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slotNumbers[i], slotNumbers[j]] = [slotNumbers[j], slotNumbers[i]];
    }

    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        await new Promise(r => setTimeout(r, 12));

        const cat = deck[i];
        team.category = cat;
        team.tenantSlot = slotNumbers[i];

        const badge = document.getElementById(`badge-${team.id}`);
        badge.style.background = `${cat.color}22`;
        badge.style.border = `1px solid ${cat.color}55`;
        badge.style.color = cat.color;
        badge.style.boxShadow = `0 0 15px ${cat.color}22`;
        badge.innerHTML = `<strong>${team.tenantSlot}</strong> - ${cat.name}`;

        badge.style.animation = 'none';
        badge.offsetHeight; // trigger reflow
        badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    document.body.classList.remove('shuffling');
    updateStats();
    btn.disabled = false;
    document.getElementById('exportBtn').disabled = false;
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function reset() {
    teams.forEach(t => {
        t.category = null;
        t.tenantSlot = null;
        const badge = document.getElementById(`badge-${t.id}`);
        badge.className = 'category-badge';
        badge.removeAttribute('style');
        badge.innerText = 'Wait for assignment';
    });
    updateStats();
    document.getElementById('exportBtn').disabled = true;
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportToExcel() {
    if (!teams[0] || !teams[0].category) {
        alert('Silakan randomize terlebih dahulu!');
        return;
    }

    const data = teams.map((t, index) => ({
        'No': index + 1,
        'Nama Tim': t.name,
        'Nomor Tenant': t.tenantSlot,
        'Kategori': t.category.name
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenants');
    XLSX.writeFile(workbook, 'Pembagian_Tenant_Cifair.xlsx');
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function openSettings() {
    renderSettingsModal();
    document.getElementById('settingsModal').classList.add('open');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('open');
}

function renderSettingsModal() {
    document.getElementById('settingTeamCount').value = teamCount;

    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = '';
    categories.forEach(cat => appendCategoryRow(cat));

    updateQuotaHint();
}

function appendCategoryRow(cat) {
    const tbody = document.getElementById('categoryTableBody');
    const row = document.createElement('tr');
    row.dataset.catId = cat ? cat.id : `cat_${++catIdCounter}`;

    const name  = cat ? cat.name  : 'Kategori Baru';
    const color = cat ? cat.color : '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    const quota = cat ? cat.quota : 0;

    row.innerHTML = `
        <td><input type="text" class="modal-input" value="${name}" placeholder="Nama kategori"></td>
        <td><input type="color" class="color-swatch" value="${color}"></td>
        <td><input type="number" class="modal-input quota-input" value="${quota}" min="0"></td>
        <td><button class="btn-delete-cat" title="Hapus kategori">✕</button></td>
    `;

    // Live quota update on input change
    row.querySelector('.quota-input').addEventListener('input', updateQuotaHint);
    row.querySelector('.btn-delete-cat').addEventListener('click', () => {
        row.remove();
        updateQuotaHint();
    });

    tbody.appendChild(row);
}

function addNewCategory() {
    appendCategoryRow(null);
    updateQuotaHint();
}

function updateQuotaHint() {
    const target = parseInt(document.getElementById('settingTeamCount').value) || 0;
    const rows   = document.querySelectorAll('#categoryTableBody tr');
    let total    = 0;
    rows.forEach(r => { total += parseInt(r.querySelector('.quota-input').value) || 0; });

    document.getElementById('quotaTotal').textContent  = total;
    document.getElementById('quotaTarget').textContent = target;

    const hint = document.getElementById('quotaHint');
    if (total === target && target > 0) {
        hint.classList.remove('hint-error');
        hint.classList.add('hint-ok');
    } else {
        hint.classList.remove('hint-ok');
        hint.classList.add('hint-error');
    }
}

function saveSettings() {
    const newCount = parseInt(document.getElementById('settingTeamCount').value);
    if (!newCount || newCount < 1) {
        showModalError('Jumlah tim harus minimal 1!');
        return;
    }

    const rows = document.querySelectorAll('#categoryTableBody tr');
    if (rows.length === 0) {
        showModalError('Harus ada minimal 1 kategori!');
        return;
    }

    const newCategories = [];
    let totalQuota = 0;

    for (const row of rows) {
        const name  = row.querySelector('input[type="text"]').value.trim();
        const color = row.querySelector('input[type="color"]').value;
        const quota = parseInt(row.querySelector('.quota-input').value) || 0;
        const id    = row.dataset.catId;

        if (!name) {
            showModalError('Nama kategori tidak boleh kosong!');
            return;
        }
        newCategories.push({ id, name, color, quota });
        totalQuota += quota;
    }

    if (totalQuota !== newCount) {
        showModalError(`Total kuota (${totalQuota}) harus sama dengan jumlah tim (${newCount})!`);
        return;
    }

    // Apply & reinitialize
    teamCount  = newCount;
    categories = newCategories;
    closeSettings();
    init();
    reset();
}

function showModalError(msg) {
    const existing = document.querySelector('.modal-error-msg');
    if (existing) existing.remove();

    const el = document.createElement('p');
    el.className = 'modal-error-msg';
    el.textContent = '⚠ ' + msg;
    document.querySelector('.modal-footer').prepend(el);

    setTimeout(() => el.remove(), 3500);
}

// ─── Expose for inline handlers ───────────────────────────────────────────────
window.updateName = updateName;

// ─── Bootstrap ────────────────────────────────────────────────────────────────
init();

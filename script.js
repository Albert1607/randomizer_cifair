const CATEGORIES = [
    { id: 'berat', name: 'Makanan Berat', class: 'makanan-berat' },
    { id: 'ringan', name: 'Makanan Ringan', class: 'makanan-ringan' },
    { id: 'minuman', name: 'Minuman', class: 'minuman' }
];

let teams = [];

// Initialize
function init() {
    const grid = document.getElementById('teamGrid');
    teams = [];
    grid.innerHTML = '';

    for (let i = 1; i <= 50; i++) {
        teams.push({
            id: i,
            name: `Team ${i}`,
            category: null
        });

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

    updateStats();

    // Add event listeners
    document.getElementById('randomizeBtn').addEventListener('click', startRandomization);
    document.getElementById('resetBtn').addEventListener('click', reset);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
}

function updateName(id, newName) {
    const team = teams.find(t => t.id === id);
    if (team) {
        team.name = newName;
    }
}

async function startRandomization() {
    const btn = document.getElementById('randomizeBtn');
    btn.disabled = true;
    
    // Reset categories first
    teams.forEach(t => t.category = null);
    document.querySelectorAll('.category-badge').forEach(el => {
        el.className = 'category-badge';
        el.innerText = 'Rolling...';
    });

    // Add shuffling effect
    document.body.classList.add('shuffling');

    // Menerapkan urutan tetap tenant dari pengguna
    const TENANT_SLOTS = [
        { slot: 1, categoryId: 'berat' }, { slot: 2, categoryId: 'minuman' }, { slot: 3, categoryId: 'ringan' }, { slot: 4, categoryId: 'berat' }, { slot: 5, categoryId: 'minuman' },
        { slot: 6, categoryId: 'ringan' }, { slot: 7, categoryId: 'berat' }, { slot: 8, categoryId: 'minuman' }, { slot: 9, categoryId: 'ringan' }, { slot: 10, categoryId: 'berat' },
        { slot: 11, categoryId: 'minuman' }, { slot: 12, categoryId: 'ringan' }, { slot: 13, categoryId: 'berat' }, { slot: 14, categoryId: 'minuman' }, { slot: 15, categoryId: 'ringan' },
        { slot: 16, categoryId: 'berat' }, { slot: 17, categoryId: 'minuman' }, { slot: 18, categoryId: 'berat' }, { slot: 19, categoryId: 'minuman' }, { slot: 20, categoryId: 'ringan' },
        { slot: 21, categoryId: 'berat' }, { slot: 22, categoryId: 'minuman' }, { slot: 23, categoryId: 'ringan' }, { slot: 24, categoryId: 'berat' }, { slot: 25, categoryId: 'minuman' },
        { slot: 26, categoryId: 'ringan' }, { slot: 27, categoryId: 'minuman' }, { slot: 28, categoryId: 'berat' }, { slot: 29, categoryId: 'ringan' }, { slot: 30, categoryId: 'minuman' },
        { slot: 31, categoryId: 'berat' }, { slot: 32, categoryId: 'ringan' }, { slot: 33, categoryId: 'minuman' }, { slot: 34, categoryId: 'berat' }, { slot: 35, categoryId: 'ringan' },
        { slot: 36, categoryId: 'berat' }, { slot: 37, categoryId: 'minuman' }, { slot: 38, categoryId: 'ringan' }, { slot: 39, categoryId: 'berat' }, { slot: 40, categoryId: 'minuman' },
        { slot: 41, categoryId: 'ringan' }, { slot: 42, categoryId: 'minuman' }, { slot: 43, categoryId: 'berat' }, { slot: 44, categoryId: 'ringan' }, { slot: 45, categoryId: 'berat' },
        { slot: 46, categoryId: 'berat' }, { slot: 47, categoryId: 'ringan' }, { slot: 48, categoryId: 'berat' }, { slot: 49, categoryId: 'berat' }, { slot: 50, categoryId: 'berat' }
    ];

    let deck = [...TENANT_SLOTS];

    // Fisher-Yates Shuffle to randomize the slot assignments
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Randomize
    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        
        // Small stagger for effect
        await new Promise(r => setTimeout(r, 20)); 
        
        // Assign random tenant slot
        const assignedSlot = deck[i];
        const categoryData = CATEGORIES.find(c => c.id === assignedSlot.categoryId);
        
        team.category = categoryData;
        team.tenantSlot = assignedSlot.slot;
        
        const badge = document.getElementById(`badge-${team.id}`);
        badge.className = `category-badge ${categoryData.class}`;
        badge.innerHTML = `<strong>${assignedSlot.slot}</strong> - ${categoryData.name}`;
        
        // Trigger reflow for animation
        badge.style.animation = 'none';
        badge.offsetHeight; /* trigger reflow */
        badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    document.body.classList.remove('shuffling');
    updateStats();
    btn.disabled = false;
    document.getElementById('exportBtn').disabled = false;
}

function reset() {
    teams.forEach(t => {
        t.category = null;
        const badge = document.getElementById(`badge-${t.id}`);
        badge.className = 'category-badge';
        badge.innerText = 'Wait for assignment';
    });
    updateStats();
    document.getElementById('exportBtn').disabled = true;
}

function updateStats() {
    const counts = {
        'Makanan Berat': 0,
        'Makanan Ringan': 0,
        'Minuman': 0
    };

    teams.forEach(t => {
        if (t.category) {
            counts[t.category.name]++;
        }
    });

    document.getElementById('count-berat').innerText = counts['Makanan Berat'];
    document.getElementById('count-ringan').innerText = counts['Makanan Ringan'];
    document.getElementById('count-minuman').innerText = counts['Minuman'];
}

function exportToExcel() {
    if (!teams[0] || !teams[0].category) {
        alert("Silakan randomize terlebih dahulu!");
        return;
    }

    // Siapkan data untuk Excel
    const data = teams.map((t, index) => ({
        "No": index + 1,
        "Nama Tim": t.name,
        "Nomor Tenant": t.tenantSlot,
        "Kategori": t.category.name
    }));

    // Generate workbook dengan SheetJS
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");

    // Unduh file .xlsx
    XLSX.writeFile(workbook, "Pembagian_Tenant_Cifair.xlsx");
}

// Global scope for inline event handlers
window.updateName = updateName;

// Run init on load
init();

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

    // Create a deck with fixed distribution
    // 20 Makanan Berat, 15 Makanan Ringan, 15 Minuman
    let deck = [];
    for (let i = 0; i < 20; i++) deck.push(CATEGORIES.find(c => c.id === 'berat'));
    for (let i = 0; i < 15; i++) deck.push(CATEGORIES.find(c => c.id === 'ringan'));
    for (let i = 0; i < 15; i++) deck.push(CATEGORIES.find(c => c.id === 'minuman'));

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Randomize
    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        
        // Small stagger for effect
        await new Promise(r => setTimeout(r, 20)); 
        
        // Use the shuffled deck
        // Fallback to random if deck runs out (though it shouldn't for 50 teams)
        const randomCat = deck[i] || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        
        team.category = randomCat;
        
        const badge = document.getElementById(`badge-${team.id}`);
        badge.className = `category-badge ${randomCat.class}`;
        badge.innerText = randomCat.name;
        
        // Trigger reflow for animation
        badge.style.animation = 'none';
        badge.offsetHeight; /* trigger reflow */
        badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    document.body.classList.remove('shuffling');
    updateStats();
    btn.disabled = false;
}

function reset() {
    teams.forEach(t => {
        t.category = null;
        const badge = document.getElementById(`badge-${t.id}`);
        badge.className = 'category-badge';
        badge.innerText = 'Wait for assignment';
    });
    updateStats();
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

// Global scope for inline event handlers
window.updateName = updateName;

// Run init on load
init();

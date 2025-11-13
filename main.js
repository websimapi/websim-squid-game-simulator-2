let persistentGroupColors = {};

// --- NEW: Grid Viewport State ---
let scale = 1;
let panX = 0;
let panY = 0;
// --- END NEW ---

function toggleAdvancedSettings() {
    const content = document.getElementById('advanced-settings-content');
    const toggle = document.getElementById('advanced-settings-toggle');
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        toggle.textContent = 'Advanced New Game Settings [Click to Close]';
    } else {
        content.style.display = 'none';
        toggle.textContent = 'Advanced New Game Settings [Click to Open]';
    }
}

// Global state variables
let players = [];
let gameState = {};
let gameHistory = [];
let eliminatedOrder = [];
let isGroupView = false;

// --- NEW: Grid Interaction Functions ---
function updateTransform() {
    const playersContainer = document.getElementById('players');
    if (playersContainer) {
        playersContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }
}

function zoom(factor) {
    scale *= factor;
    // Clamp zoom level
    scale = Math.max(0.1, Math.min(scale, 10));
    updateTransform();
}

function resetZoom() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
}

function setupGridInteraction() {
    const viewport = document.getElementById('grid-viewport');
    if (!viewport) return;

    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;

    viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only pan on left-click
        e.preventDefault();
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        viewport.style.cursor = 'grabbing';
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
    });

    const stopPanning = () => {
        if (!isPanning) return;
        isPanning = false;
        viewport.style.cursor = 'grab';
    };
    
    viewport.addEventListener('mouseup', stopPanning);
    viewport.addEventListener('mouseleave', stopPanning);
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        zoom(zoomFactor);
    }, { passive: false });
}
// --- END NEW ---

function getTraitValue(trait) {
    const min = parseInt(document.getElementById(`adv${trait}Min`).value) || 1;
    const max = parseInt(document.getElementById(`adv${trait}Max`).value) || 15;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createPlayer(id, isAdvanced, options) {
    let player = {
        id: id,
        status: 'active',
        gender: Math.random() < 0.5 ? 'Male' : 'Female',
        age: Math.floor(Math.random() * 40) + 18,
        country: 'South Korea',
        allies: [],
        enemies: [],
        protection: 0,
    };

    if (isAdvanced) {
        player.strength = getTraitValue('Str');
        player.agility = getTraitValue('Agi');
        player.intelligence = getTraitValue('Int');
        player.charisma = getTraitValue('Cha');
        player.luck = getTraitValue('Lck');
        player.cowardice = getTraitValue('Cow');
        player.greed = getTraitValue('Grd');
        player.country = document.getElementById('advCountry').value || player.country;
        const ageMin = parseInt(document.getElementById('advAgeMin').value) || 18;
        const ageMax = parseInt(document.getElementById('advAgeMax').value) || 70;
        player.age = Math.floor(Math.random() * (ageMax - ageMin + 1)) + ageMin;
        if (options.maleCount > 0) {
            player.gender = 'Male';
            options.maleCount--;
        } else if (options.femaleCount > 0) {
            player.gender = 'Female';
            options.femaleCount--;
        }

    } else {
         player.strength = Math.floor(Math.random() * 10) + 1;
         player.agility = Math.floor(Math.random() * 10) + 1;
         player.intelligence = Math.floor(Math.random() * 10) + 1;
         player.charisma = Math.floor(Math.random() * 10) + 1;
         player.luck = Math.floor(Math.random() * 10) + 1;
         player.cowardice = Math.floor(Math.random() * 5);
         player.greed = Math.floor(Math.random() * 5);
    }
    return player;
}

function updateAllPlayerDivs() {
    const playersContainer = document.getElementById('players');
    const viewport = document.getElementById('grid-viewport');
    if (!playersContainer || !viewport) return;

    playersContainer.innerHTML = '';

    // --- NEW: Grid Layout Logic ---
    const playerSize = 42; // Includes margin
    const playersPerRow = Math.floor(viewport.clientWidth / playerSize);
    const numRows = Math.ceil(players.length / playersPerRow);

    playersContainer.style.width = `${playersPerRow * playerSize}px`;
    playersContainer.style.height = `${numRows * playerSize}px`;
    // --- END NEW ---

    players.forEach((p, index) => {
        let playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.id = `player-${p.id}`;
        playerDiv.dataset.id = p.id;

        // --- NEW: Positioning ---
        const row = Math.floor(index / playersPerRow);
        const col = index % playersPerRow;
        playerDiv.style.left = `${col * playerSize}px`;
        playerDiv.style.top = `${row * playerSize}px`;
        // --- END NEW ---

        let playerNumberSpan = document.createElement('span');
        playerNumberSpan.className = 'player-number';
        playerNumberSpan.textContent = p.id.toString().padStart(3, '0');
        playerDiv.appendChild(playerNumberSpan);

        if (p.status === 'eliminated') {
            playerDiv.classList.add('eliminated');
        }

        playersContainer.appendChild(playerDiv);
    });
}

function updatePlayersRemaining() {
    const playersRemainingSpan = document.getElementById('playersRemaining');
    if(playersRemainingSpan) {
        playersRemainingSpan.textContent = players.filter(p => p.status === 'active').length;
    }
}


function startGame(isAdvanced) {
    const numPlayersInput = document.getElementById('numPlayers');
    const numPlayers = parseInt(numPlayersInput.value, 10);

    if (isNaN(numPlayers) || numPlayers < 2) {
        alert("Please enter a valid number of players (at least 2).");
        return;
    }

    players = [];
    eliminatedOrder = [];
    isGroupView = false;
    persistentGroupColors = {};
    
    // --- NEW: Reset zoom on new game ---
    resetZoom();
    // --- END NEW ---

    gameState = {
        round: 0,
        playersRemaining: numPlayers,
        isVanilla: !isAdvanced,
        gameId: Date.now()
    };

    let advancedOptions = {};
    if (isAdvanced) {
        advancedOptions.femaleCount = parseInt(document.getElementById('advFemaleCount').value) || -1;
        advancedOptions.maleCount = parseInt(document.getElementById('advMaleCount').value) || -1;
        
        let totalGendered = 0;
        if(advancedOptions.femaleCount > 0) totalGendered += advancedOptions.femaleCount;
        if(advancedOptions.maleCount > 0) totalGendered += advancedOptions.maleCount;

        if (totalGendered > numPlayers) {
            alert("The sum of specified male and female players cannot exceed the total number of players.");
            return;
        }
    }
    
    for (let i = 1; i <= numPlayers; i++) {
        players.push(createPlayer(i, isAdvanced, advancedOptions));
    }
    
    updateAllPlayerDivs();
    updatePlayersRemaining();
    document.getElementById('history-slider-container').style.display = 'block';
}

// --- NEW: Initialize grid controls on load ---
document.addEventListener('DOMContentLoaded', () => {
    setupGridInteraction();
});
// --- END NEW ---
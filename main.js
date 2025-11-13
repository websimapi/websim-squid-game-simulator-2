let persistentGroupColors = {};

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
    playersContainer.innerHTML = ''; 

    players.forEach(p => {
        let playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.id = `player-${p.id}`;
        playerDiv.dataset.id = p.id;

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
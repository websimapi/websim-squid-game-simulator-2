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
    const playersContainer = document.getElementById('players');
    if (!playersContainer) return;
    
    // Logic to zoom towards the center of the viewport
    const viewport = document.getElementById('grid-viewport');
    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenterX = viewportRect.width / 2;
    const viewportCenterY = viewportRect.height / 2;

    const newScale = Math.max(0.1, Math.min(scale * factor, 10));

    // Pan to keep the center point the same
    panX = viewportCenterX - (viewportCenterX - panX) * (newScale / scale);
    panY = viewportCenterY - (viewportCenterY - panY) * (newScale / scale);

    scale = newScale;

    updateTransform();
}

function resetZoom() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
    const viewport = document.getElementById('grid-viewport');
    if (viewport) {
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
    }
}

function setupGridInteraction() {
    const viewport = document.getElementById('grid-viewport');
    if (!viewport) return;

    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;
    let startScrollX = 0;
    let startScrollY = 0;

    viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only pan on left-click
        isPanning = true;
        startPanX = e.clientX;
        startPanY = e.clientY;
        startScrollX = viewport.scrollLeft;
        startScrollY = viewport.scrollTop;
        viewport.style.cursor = 'grabbing';
        viewport.style.userSelect = 'none';
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const dx = e.clientX - startPanX;
        const dy = e.clientY - startPanY;
        viewport.scrollLeft = startScrollX - dx;
        viewport.scrollTop = startScrollY - dy;
    });

    const stopPanning = () => {
        if (!isPanning) return;
        isPanning = false;
        viewport.style.cursor = 'grab';
        viewport.style.removeProperty('user-select');
    };
    
    viewport.addEventListener('mouseup', stopPanning);
    viewport.addEventListener('mouseleave', stopPanning);
    
    // Keep wheel zoom but prevent default scroll page behavior
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

function playRound() {
    const numEliminatedInput = document.getElementById('numEliminated');
    const reasonInput = document.getElementById('roundDescription');
    
    if (!numEliminatedInput || !reasonInput) {
        console.error("Required input elements not found for playRound.");
        return;
    }

    const numToEliminate = parseInt(numEliminatedInput.value, 10);
    const reason = reasonInput.value || "failed a generic challenge";

    if (isNaN(numToEliminate) || numToEliminate < 0) {
        alert("Please enter a valid number of players to eliminate.");
        return;
    }

    const activePlayers = players.filter(p => p.status === 'active');

    if (activePlayers.length === 0) {
        alert("No active players left to eliminate.");
        return;
    }

    gameState.round++;
    const logEntry = document.createElement('li');

    if (numToEliminate === 0) {
        logEntry.innerHTML = `<b>Round ${gameState.round}:</b> No players were eliminated.`;
        document.getElementById('gameLogList').prepend(logEntry);
        return; // No UI update needed if no one is eliminated
    }
    
    if (numToEliminate >= activePlayers.length) {
        if (activePlayers.length > 1) {
             alert(`This will eliminate all remaining players and may end the game.`);
        }
    }
    
    const playersToEliminate = activePlayers.sort(() => 0.5 - Math.random()).slice(0, numToEliminate);

    playersToEliminate.forEach(player => {
        player.status = 'eliminated';
        eliminatedOrder.push({ id: player.id, reason: reason, round: gameState.round });
    });

    gameState.playersRemaining = players.filter(p => p.status === 'active').length;

    // Log the event
    let eliminatedIds = playersToEliminate.map(p => p.id).join(', ');
    logEntry.innerHTML = `<b>Round ${gameState.round}:</b> ${playersToEliminate.length} players eliminated (${eliminatedIds}) because they ${reason}.`;
    document.getElementById('gameLogList').prepend(logEntry);
    
    updateAllPlayerDivs();
    updatePlayersRemaining();
}

// --- NEW: Initialize grid controls on load ---
document.addEventListener('DOMContentLoaded', () => {
    setupGridInteraction();
});
// --- END NEW ---

let playerGroupId = {};
let round = 0;
let customPlayerPhotos = {};
let forcedWinnerId = null;
let winChanceChart = null;
const chartColors = ['blue', 'red', 'green', 'purple', 'orange', 'black'];
let roundEliminations = [];
let personalityPlayers = new Set();
let superpoweredPlayerIds = new Set();
let eliminatedHidden = false;
let season2ModeActive = false;
let showVoteColors = false;
let votingRoundCount = 0;
let showGroups = false;
let persistentGroupColors = {};
let firstEliminationOfGame = false;

// Feature Variables
let favoritedPlayerIds = new Set();
let eliminationOrder = [];
let gameHistorySnapshots = [];
let isViewingHistory = false;
let livePlayersState = null;
let usedEvents = new Set();

// Archive Viewing Variables
let isViewingArchivedGame = false;
let liveGameStateBackup = null;

let gridPositions = {}; // Player ID -> {x, y} mapping
let originalRosterSize = 0;
let isCompactedView = false;


let customGames = [];

// Animation variables
let animationModeEnabled = false;
let animationPaused = false;
let animationTimeoutId = null;
let playersToEliminateInAnimation = [];
let animatedEliminationIndex = 0;
let announcementTimeoutId = null;

let currentPrizePot = 0;

// --- VIP BETTING & ACHIEVEMENTS VARIABLES ---
let bettingBalance = 1000000;
let isGameModified = false;
let currentBets = []; // { playerId, amount, initialRound, potentialPayout }
let achievements = {};

const TOTAL_PRIZE_MONEY = 45600000; // Changed from KRW to USD
const countries = ["China", "India", "USA", "Brazil", "Nigeria", "Russia", "Japan", "Germany", "UK", "France", "Canada", "Australia", "South Korea", "Mexico", "Indonesia", "Pakistan", "Bangladesh", "Ethiopia", "Philippines", "Egypt", "Vietnam", "DR Congo", "Turkey", "Iran", "Thailand", "Italy", "South Africa", "Tanzania", "Myanmar", "Colombia", "Kenya", "Spain", "Argentina", "Ukraine", "Uganda", "Algeria", "Sudan", "Iraq", "Afghanistan", "Poland", "Morocco", "Saudi Arabia", "Uzbekistan", "Peru", "Angola", "Malaysia", "Mozambique", "Ghana", "Yemen", "Nepal", "Venezuela"];
const occupations = ["Teacher", "Engineer", "Doctor", "Nurse", "Farmer", "Police Officer", "Firefighter", "Lawyer", "Accountant", "Architect", "Pilot", "Chef", "Dentist", "Pharmacist", "Software Developer", "Electrician", "Plumber", "Carpenter", "Mechanic", "Veterinarian", "Scientist", "Journalist", "Artist", "Musician", "Actor", "Unemployed", "Unemployed", "Unemployed", "Unemployed", "Unemployed", "Unemployed", "Unemployed", "Unemployed", "Unemployed"];
const genders = ["Male", "Female"];

const firstNamesMale = ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Theodore", "Leo", "Julian", "Alexander", "Maverick", "Asher", "Mateo", "Ethan", "Ezra", "Sebastian", "Jackson", "Daniel", "Michael", "Logan", "Owen", "Samuel", "Jacob", "Jack", "Levi", "Wyatt", "Mateo", "Gabriel", "Luke", "Anthony", "Grayson", "Dylan", "Jayden", "Muhammad", "Isaiah", "Aaron", "Joseph", "Charles", "David", "Christian", "Andrew", "George", "John", "Nathan", "Christopher", "Thomas", "Ryan", "Jonathan", "Adrian", "Caleb", "Miles", "Josiah", "Eli", "Isaac", "Lincoln", "Kai", "Nolan", "Hudson", "Declan", "Dominic", "Cameron", "Brooks", "Gael", "Everett", "Jordan", "Carson", "Jasper", "August", "Rowan", "Silas", "Cole", "Wesley", "Harrison", "Weston", "Bennett", "Remi", "Bennett", "Finnegan", "Milo", "Rhys", "Arlo", "Jude", "Asa", "Leon", "Bodhi", "Orion", "Wilder", "Fox", "Knox", "Beckett", "Atticus", "Alden", "Soren", "Stellan", "Gus", "Ozzy", "Bear", "Wolf", "Arrow", "Fielder", "Shepherd", "Archer", "Hunter", "Ryder", "Sawyer", "Forrest", "River", "Clay", "Ford", "Sterling", "Kian", "Caspian", "Rune", "Thorne", "Valor", "Journey", "Atlas", "Apollo", "Cassian", "Leif", "Odin", "Thorin", "Vance", "Zion", "Blaise", "Caelen", "Koa", "Remy", "Yves", "Alistair", "Clement", "Emrys", "Euan", "Gideon", "Quinn", "Tiernan", "Vaughn", "Zev", "Heath", "Larkin", "Perry", "Quincy", "Reid", "Sutton", "Wade", "Yuri", "Zane", "Aldo", "Bastian", "Bruno", "Cian", "Cody", "Conrad", "Cosmo", "Dorian", "Emmett", "Enzo", "Felix", "Flynn", "Franco", "Giovanni", "Hugo", "Ignacio", "Jasper", "Julian", "Kade", "Kaiser", "Keaton", "Lachlan", "Lazaro", "Maddox", "Matias", "Miguel", "Nash", "Neo", "Otto", "Pascal", "Pax", "Phoenix", "Quentin", "Raul", "Rex", "Rocco", "Romeo", "Ronan", "Roscoe", "Rory", "Ruben", "Salvatore", "Santiago", "Sasha", "Sterling", "Tate", "Tristan", "Valentino", "Victor", "Viggo", "Vito", "Warren", "Wolfgang", "Xavier", "Yael", "Zander", "Zeus", "Arthur", "Barnaby", "Bartholomew", "Benedict", "Benson", "Bernard", "Bertram", "Byron", "Cedric", "Clarence", "Clifford", "Cornelius", "Curtis", "Cyrus", "Desmond", "Edgar", "Edmund", "Edwin", "Eugene", "Francis", "Frederick", "Gerald", "Gilbert", "Harold", "Harvey", "Herbert", "Homer", "Horace", "Irving", "Jerome", "Julian", "Leon", "Louis", "Luther", "Marvin", "Melvin", "Merton", "Milton", "Montgomery", "Morton", "Norman", "Oscar", "Otto", "Patrick", "Percival", "Peter", "Philip", "Raymond", "Reginald", "Richard", "Roger", "Roland", "Ronald", "Rufus", "Russell", "Stanley", "Stuart", "Terence", "Theodore", "Timothy", "Vincent", "Wallace", "Walter", "Warren", "Wilfred", "Willard", "Clint", "Dustin", "Chad", "Drew", "Todd", "Shawn", "Brad", "Corey", "Dustin", "Jesse", "Shane", "Trent", "Blake", "Clayton", "Dillon", "Dustin", "Garrett", "Jeremy", "Justin", "Kevin", "Kyle", "Mason", "Mitchell", "Preston", "Spencer", "Taylor", "Travis", "Trevor", "Tyler", "Wyatt", "Zachary", "Brady", "Brody", "Chance", "Chase", "Cody", "Colby", "Dakota", "Dallas", "Denver", "Devin", "Dusty", "Easton", "Fisher", "Gage", "Houston", "Hunter", "Jackson", "Jaden", "Jared", "Jordan", "Kaden", "Kai", "Kayden", "Keegan", "Kellan", "Kieran", "Kobe", "Kyler", "Lane", "Landon", "Levi", "Liam", "Logan", "Lucas", "Malachi", "Mason", "Milo", "Myles", "Noah", "Owen", "Parker", "Peyton", "Phoenix", "Preston", "Quinn", "Riley", "Rory", "Rowan", "Ryder", "Sawyer", "Seth", "Silas", "Skyler", "Spencer", "Tanner", "Tate", "Teagan", "Tyler", "Wesley", "Wyatt", "Zane", "Zeus", "Abner", "Aldous", "Ames", "Ansel", "Barnaby", "Blaise", "Blythe", "Booker", "Bram", "Caius", "Callum", "Cato", "Channing", "Clayton", "Crispin", "Cyprian", "Digby", "Dashiell", "Emilio", "Ephraim", "Ferdinand", "Florian", "Gideon", "Gus", "Ignatius", "Inigo", "Jago", "Jiro", "Klaus", "Lazarus", "Lysander", "Malachy", "Marcel", "Marius", "Maxim", "Montgomery", "Nestor", "Oberon", "Octavius", "Peregrine", "Philemon", "Primo", "Rainer", "Ragnar", "Raphael", "Remus", "Sylvan", "Thaddeus", "Valerius", "Viggo", "Wolfgang", "Xerxes", "Yves", "Zephyr", "Ares", "Ajax", "Caius", "Draco", "Echo", "Jett", "Kael", "Loki", "Morpheus", "Onyx", "Orion", "Pax", "Ragnar", "Rook", "Storm", "Titan", "Valor", "Wilder", "Zane", "Ace", "Dash", "Jet", "Kit", "Lex", "Pax", "Rhett", "Taj", "Zev", "Beau", "Blaise", "Brody", "Dane", "Finn", "Gage", "Jude", "Knox", "Milo", "Quinn", "Rhys", "Sage", "Tate", "Zion", "Adonis", "Alaric", "Apollo", "Augustus", "Balthazar", "Cassian", "Caspian", "Celestin", "Crispin", "Cyril", "Demetrius", "Dorian", "Evander", "Fabian", "Gareth", "Hadrian", "Ignatius", "Jasper", "Julian", "Lysander", "Maximus", "Orion", "Percival", "Philemon", "Rafferty", "Ragnar", "Remus", "Soren", "Sterling", "Thaddeus", "Valentino", "Valerius", "Vincent", "Virgil", "Wolfgang", "Xavier", "Yves", "Zephyr", "Zeus", "Bartholomew", "Benedict", "Constantine", "Cornelius", "Cyprian", "Desmond", "Edgar", "Edmund", "Edwin", "Ernest", "Eugene", "Frederick", "Geoffrey", "Gilbert", "Harold", "Harvey", "Herbert", "Horace", "Humphrey", "Jeremy", "Julian", "Lawrence", "Leopold", "Louis", "Luther", "Marvin", "Melvin", "Milton", "Montgomery", "Mortimer", "Nathaniel", "Norman", "Orlando", "Osmond", "Oswald", "Percival", "Philemon", "Quentin", "Reginald", "Roland", "Roscoe", "Rufus", "Russell", "Sidney", "Stanley", "Stuart", "Terence", "Theodore", "Timothy", "Victor", "Wallace", "Walter", "Wilfred", "Willard", "Winslow", "Worthington", "York", "Zebedee", "Zelmar", "Zenas", "Zephaniah", "Zeth", "Zoltan", "Robert", "Dalton"];
const firstNamesFemale = ["Olivia", "Emma", "Ava", "Sophia", "Isabella", "Charlotte", "Amelia", "Mia", "Harper", "Evelyn", "Abigail", "Emily", "Ella", "Scarlett", "Grace", "Chloe", "Victoria", "Lily", "Hannah", "Layla", "Zoey", "Penelope", "Riley", "Nora", "Hazel", "Eleanor", "Violet", "Aurora", "Audrey", "Elizabeth", "Stella", "Lucy", "Paisley", "Everly", "Anna", "Natalie", "Ruby", "Alice", "Freya", "Willow", "Sophie", "Genesis", "Ivy", "Naomi", "Elena", "Sarah", "Clara", "Alexa", "Nova", "Madeline", "Bella", "Maya", "Maria", "Serenity", "Autumn", "Mila", "Cora", "Leah", "Adeline", "Luna", "Gianna", "Valentina", "Peyton", "Aria", "Esme", "Sadie", "Skylar", "Brooklyn", "Amaya", "Kinsley", "Delilah", "Kayla", "Camila", "Zara", "Maeve", "Iris", "Jade", "Summer", "Rosie", "Daisy", "Juniper", "Rowan", "Sage", "Olive", "Wren", "Poppy", "Lyra", "Cleo", "Fern", "Flora", "Dawn", "Echo", "Fable", "Journey", "Lyric", "Melody", "Harmony", "Winter", "Spring", "Rain", "River", "Sky", "Star", "Moon", "Sun", "Ocean", "Lake", "Meadow", "Forest", "Rose", "Lily", "Blossom", "Petal", "Sunny", "Cloud", "Storm", "Twilight", "Celeste", "Starlight", "Seraphina", "Evangeline", "Ophelia", "Persephone", "Anastasia", "Genevieve", "Clementine", "Guinevere", "Cordelia", "Lavender", "Magnolia", "Primrose", "Adalyn", "Adelaide", "Adriana", "Alana", "Alessandra", "Alexandra", "Alexis", "Alina", "Alison", "Allison", "Alma", "Alyssa", "Amanda", "Amber", "Amy", "Andrea", "Angel", "Angela", "Angelina", "Annabelle", "Annelise", "Annie", "Anya", "April", "Arabella", "Ariana", "Ariel", "Ashley", "Astrid", "Athena", "Aubree", "Audrina", "Aurelia", "Aviana", "Ayana", "Bianca", "Blair", "Brianna", "Bridget", "Bronte", "Brooke", "Brynn", "Callie", "Cara", "Carly", "Carolina", "Cassandra", "Catalina", "Catherine", "Cecilia", "Celina", "Chanel", "Charlotte", "Chelsea", "Cheryl", "Christine", "Cindy", "Claire", "Coco", "Colette", "Constance", "Crystal", "Cynthia", "Dahlia", "Dana", "Daphne", "Darcy", "Davina", "Deborah", "Denise", "Desiree", "Diana", "Dixie", "Dolores", "Donna", "Dorothy", "Edith", "Edna", "Eileen", "Elaine", "Elara", "Eliana", "Eliza", "Elle", "Eloise", "Elsa", "Emilia", "Esther", "Eudora", "Eugenie", "Evie", "Fallon", "Felicity", "Fiona", "Florence", "Frances", "Francesca", "Gabriella", "Georgia", "Giselle", "Glynnis", "Greta", "Gretchen", "Gwen", "Hadley", "Hallie", "Hayden", "Heather", "Heidi", "Helena", "Holly", "Hope", "Imogen", "Ines", "Ingrid", "Iona", "Ireland", "Isla", "Jasmine", "Jenna", "Jennifer", "Jessica", "Jillian", "Joanna", "Jocelyn", "Johanna", "Jolene", "Josephine", "Joy", "Joyce", "Judith", "Julia", "Juliet", "Justine", "Kara", "Karen", "Karina", "Katherine", "Kathleen", "Katie", "Keira", "Kelsey", "Kendra", "Kerry", "Kimberly", "Kira", "Kitty", "Lara", "Laura", "Laurel", "Lauren", "Leilani", "Lena", "Leslie", "Lexie", "Lila", "Lilith", "Lillian", "Linnea", "Lisa", "Liv", "Lois", "Lorelei", "Loretta", "Lourdes", "Lucia", "Lucille", "Luella", "Lydia", "Mabel", "Macy", "Madeleine", "Madelyn", "Mae", "Maisie", "Malinda", "Mallory", "Margot", "Margaret", "Mariah", "Mariana", "Marigold", "Marilyn", "Marina", "Marion", "Marisa", "Marjorie", "Martha", "Martina", "Mary", "Matilda", "Maura", "Maureen", "Mavis", "Maxine", "Melanie", "Melissa", "Meredith", "Michelle", "Mildred", "Millicent", "Minnie", "Mirabel", "Miranda", "Miriam", "Monica", "Muriel", "Myra", "Nadia", "Nancy", "Nell", "Nellie", "Nerida", "Nicole", "Nina", "Noelle", "Nadia", "Odette", "Olga", "Olympia", "Orla", "Paloma", "Pamela", "Paola", "Paris", "Phoebe", "Phyllis", "Piper", "Priscilla", "Queenie", "Rachael", "Ramona", "Raquel", "Rebecca", "Regina", "Renata", "Renee", "Roberta", "Robin", "Rochelle", "Romilly", "Rosemary", "Roxanne", "Ruth", "Sabrina", "Samantha", "Sandra", "Shannon", "Shayla", "Shelby", "Shirley", "Sierra", "Simone", "Sienna", "Skye", "Stacy", "Stephanie", "Sue", "Susan", "Susanna", "Suzanne", "Sylvia", "Tabitha", "Talia", "Tamara", "Tanya", "Tara", "Tatum", "Teresa", "Tess", "Thalia", "Thea", "Thelma", "Tiffany", "Tina", "Trixie", "Ursula", "Valerie", "Vanessa", "Vera", "Veronica", "Vivian", "Wendy", "Whitney", "Wilhelmina", "Winifred", "Xenia", "Yara", "Yasmin", "Yvette", "Yvonne", "Zelda", "Zia", "Zinnia", "Zoe", "Adair", "Aine", "Bronwyn", "Caoimhe", "Ciara", "Deirdre", "Eilis", "Fiona", "Grainne", "Iona", "Keira", "Mairead", "Niamh", "Orla", "Saoirse", "Siobhan", "Sorcha", "Teagan", "Una", "Alba", "Amara", "Anika", "Astrid", "Ayda", "Beatrix", "Blanca", "Calliope", "Cosima", "Dahlia", "Elara", "Freya", "Greta", "Inara", "Iris", "Isolde", "Juno", "Kira", "Lana", "Lena", "Linnea", "Luna", "Maeve", "Mara", "Marta", "Neva", "Nila", "Oona", "Petra", "Rhea", "Romana", "Saga", "Sana", "Shira", "Silvana", "Sonja", "Tabitha", "Thalia", "Thea", "Una", "Vega", "Vera", "Xenia", "Yara", "Zara", "Zia", "Adina", "Anya", "Briar", "Bronte", "Cambria", "Coral", "Daphne", "Delphine", "Eira", "Elodie", "Estelle", "Fawn", "Gemma", "Indigo", "Juniper", "Lavender", "Lilac", "Marigold", "Melody", "Nerida", "Odessa", "Opal", "Paloma", "Petal", "Posey", "Rue", "Saffron", "Seren", "Solstice", "Story", "Tamsin", "Twila", "Willa", "Wisteria", "Zinnia", "Acacia", "Amaryllis", "Ambrosia", "Anemone", "Aurelia", "Calypso", "Celestine", "Chrysalis", "Dahlia", "Elysia", "Fleur", "Hyacinth", "Jessamine", "Lavender", "Lilith", "Magnolia", "Narcissa", "Orchid", "Petunia", "Primrose", "Rosalind", "Saffron", "Seraphina", "Sylvana", "Thalassa", "Verbena", "Violette", "Zephyrine"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White", "Lopez", "Lee", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez", "Hall", "Young", "Allen", "Sanchez", "Wright", "King", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Ramirez", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner", "Torres", "Parker", "Collins", "Edwards", "Stewart", "Flores", "Morris", "Nguyen", "Murphy", "Rivera", "Cook", "Morgan", "Cooper", "Bailey", "Reed", "Kelly", "Howard", "Diaz", "Bennett", "Gray", "James", "Myers", "Ruiz", "Hughes", "Cox", "Ward", "Foster", "Gonzales", "Bell", "Coleman", "Russell", "Long", "Patterson", "Griffin", "Watson", "Price", "Hayes", "Sanders", "Perry", "Powell", "Ramirez", "Ross", "Brooks", "Cruz", "Ortiz", "Gomez", "Murray", "Ford", "Castillo", "Wood", "Wagner", "Fisher", "Stone", "Todd", "Webb", "Wells", "West", "Wheeler", "Whitehead", "Wilkinson", "Winters", "Wolf", "Woods", "Yates", "York", "Youngblood", "Zimmerman", "Abbott", "Barnaby", "Beckett", "Caspian", "Everhart", "Finch", "Hawthorne", "Kincaid", "Larkin", "Montgomery", "Oakley", "Pemberton", "Quill", "Reynolds", "Sterling", "Thorne", "Vance", "Whittaker", "Wyatt", "Zephyr", "Adams", "Albers", "Aldridge", "Alexander", "Allison", "Armstrong", "Arnold", "Ashworth", "Atkins", "Baker", "Baldwin", "Banks", "Barber", "Barker", "Barnes", "Barnett", "Barrett", "Barton", "Bateman", "Baxter", "Bennett", "Bentley", "Berry", "Bishop", "Black", "Blair", "Blake", "Booth", "Bowen", "Boyd", "Bradley", "Bray", "Brooks", "Brown", "Browne", "Bryant", "Burke", "Burns", "Burton", "Butler", "Cain", "Calhoun", "Callahan", "Cameron", "Campbell", "Carey", "Carlson", "Carpenter", "Carroll", "Carson", "Carter", "Case", "Casey", "Cash", "Castle", "Chambers", "Chandler", "Chapman", "Chase", "Chen", "Childs", "Christensen", "Christian", "Church", "Clark", "Clayton", "Clements", "Cobb", "Coffey", "Cole", "Coleman", "Collins", "Combs", "Conley", "Connolly", "Connor", "Cook", "Cooper", "Couch", "Cowan", "Cox", "Craig", "Crawford", "Cross", "Crowley", "Cruz", "Curry", "Dale", "Dalton", "Daniels", "Darby", "Davidson", "Davies", "Dawson", "Dean", "Decker", "Delgado", "Dempsey", "Dennis", "Diaz", "Dickerson", "Dixon", "Dodd", "Dolan", "Donovan", "Douglas", "Downs", "Doyle", "Drake", "Duke", "Dunn", "Durham", "Dwyer", "Eaton", "Edwards", "Elliott", "Ellis", "Emerson", "Estes", "Evans", "Everett", "Fairchild", "Farrell", "Faulkner", "Fenton", "Ferguson", "Ferris", "Fields", "Finch", "Finley", "Fisher", "Fitzgerald", "Flannigan", "Fleming", "Fletcher", "Flores", "Flynn", "Ford", "Forrest", "Foster", "Fowler", "Fox", "Frank", "Franklin", "Fraser", "Frederick", "Freeman", "French", "Fuller", "Gage", "Gallagher", "Galloway", "Gamble", "Garcia", "Gardner", "Garrett", "Gates", "Gibson", "Gilbert", "Gilmore", "Glass", "Glenn", "Glover", "Godfrey", "Goldsmith", "Gonzales", "Goodman", "Goodwin", "Gordon", "Graham", "Grant", "Gray", "Green", "Greene", "Gregory", "Griffin", "Gross", "Guerra", "Guthrie", "Hadley", "Hale", "Hall", "Hamilton", "Hancock", "Hardy", "Harper", "Harris", "Harrison", "Hart", "Harvey", "Hawkins", "Hayes", "Haynes", "Hays", "Head", "Heard", "Heath", "Henderson", "Henry", "Herrera", "Hicks", "Higgins", "Hill", "Hobbs", "Hodges", "Hoffman", "Holland", "Holmes", "Holt", "Hood", "Hooper", "Horne", "Horton", "House", "Howard", "Howell", "Hubbard", "Hudson", "Huff", "Hughes", "Hunt", "Hunter", "Hurley", "Jackson", "Jacobs", "James", "Jarvis", "Jenkins", "Jensen", "Jimenez", "Johnson", "Jones", "Jordan", "Joseph", "Joyce", "Justice", "Kaiser", "Kane", "Kay", "Keating", "Keith", "Keller", "Kelley", "Kelly", "Kennedy", "Kent", "Kerr", "Khan", "Kim", "King", "Kirby", "Kirk", "Klein", "Knight", "Knox", "Kramer", "Lane", "Lang", "Larsen", "Larson", "Lawrence", "Lawson", "Layton", "Lee", "Lehman", "Lester", "Lewis", "Little", "Lloyd", "Locke", "Logan", "Long", "Lopez", "Love", "Lowery", "Lucas", "Lynch", "Lyon", "Mack", "Madden", "Madison", "Mahoney", "Malone", "Mann", "Manning", "Marshall", "Martin", "Martinez", "Mason", "Mathews", "Mathis", "Maxwell", "May", "Mayer", "Mayo", "McCarthy", "McClain", "McConnell", "McCoy", "McDonald", "McFarland", "McGee", "McGrath", "McGregor", "McIntyre", "McKay", "McKee", "McKinney", "McLaughlin", "McLean", "McLeod", "McMahon", "McMillan", "McNamara", "Medina", "Mendoza", "Mercer", "Merritt", "Meyer", "Miles", "Miller", "Mills", "Mitchell", "Monroe", "Montgomery", "Moore", "Morales", "Morgan", "Morris", "Morrison", "Morse", "Morton", "Moss", "Mullen", "Munoz", "Murphy", "Murray", "Myers", "Nash", "Neal", "Nelson", "Newman", "Newton", "Nguyen", "Nichols", "Noble", "Nolan", "Norman", "Norris", "Norton", "Nunez", "O'Brien", "O'Connell", "O'Connor", "O'Donnell", "O'Neal", "O'Neil", "Olsen", "Olson", "O'Malley", "Owen", "Owens", "Pace", "Page", "Palmer", "Parker", "Parks", "Patterson", "Paul", "Payne", "Perez", "Perkins", "Perry", "Peters", "Peterson", "Phelps", "Phillips", "Pierce", "Pittman", "Poole", "Porter", "Potter", "Powell", "Powers", "Pratt", "Preston", "Price", "Priest", "Prince", "Pugh", "Quinn", "Ramirez", "Ramsey", "Randall", "Randolph", "Ray", "Reed", "Reese", "Reid", "Reilly", "Reyes", "Reynolds", "Rice", "Richards", "Richardson", "Richmond", "Riley", "Rios", "Rivera", "Roberts", "Robinson", "Rodgers", "Rodriguez", "Rogers", "Romero", "Rose", "Ross", "Roth", "Rowe", "Roy", "Rubin", "Ruiz", "Russell", "Ryan", "Salazar", "Salinas", "Sanchez", "Sanders", "Santiago", "Santos", "Schmidt", "Schneider", "Scott", "Sears", "Shaw", "Shepherd", "Sherman", "Short", "Silva", "Simmons", "Simon", "Simpson", "Singh", "Sisk", "Smart", "Smith", "Snyder", "Solomon", "Soto", "Spence", "Spencer", "Stanton", "Stephens", "Sterling", "Stevens", "Stewart", "Stone", "Story", "Strickland", "Sullivan", "Sutton", "Swanson", "Taylor", "Temple", "Terrell", "Terry", "Thomas", "Thompson", "Thornton", "Titus", "Todd", "Torres", "Townsend", "Travis", "Trimble", "Trujillo", "Tucker", "Turner", "Tyler", "Underwood", "Valdez", "Vance", "Vargas", "Vaughn", "Vega", "Velez", "Vincent", "Vogel", "Wade", "Wagner", "Walker", "Wallace", "Walsh", "Ward", "Warner", "Warren", "Washington", "Waters", "Watkins", "Watson", "Watts", "Wayne", "Webb", "Weber", "Webster", "Weeks", "Wells", "West", "Wheeler", "White", "Whittaker", "Wilcox", "Wilder", "Wiley", "Wilkins", "Wilkinson", "Williams", "Williamson", "Willis", "Wilson", "Winters", "Wolf", "Wood", "Woodard", "Woods", "Worley", "Wright", "Wyatt", "Yates", "Young", "Zavala", "Ziegler", "Zimmerman", "Zuniga", "Abercrombie", "Addington", "Albright", "Alden", "Ames", "Anson", "Arlington", "Ashby", "Ashford", "Bainbridge", "Beaumont", "Beckwith", "Belmont", "Beverly", "Blackwood", "Blakely", "Bradford", "Bridgewater", "Camden", "Carrington", "Cavendish", "Chesapeake", "Cromwell", "Darlington", "Decker", "Devereaux", "Fairfax", "Faraday", "Fitzwilliam", "Fremont", "Garrison", "Hastings", "Haverford", "Hawthorne", "Kensington", "Kimball", "Kingsley", "Langdon", "Livingston", "Lowell", "Montague", "Newcomb", "Prescott", "Radcliffe", "Rutherford", "Sheridan", "Stanford", "Stratford", "Thatcher", "Vanderbilt", "Wakefield", "Warwick", "Wentworth", "Westcott", "Wharton", "Wellesley", "Westwood", "Whitaker", "Winchester", "Woodruff", "Worthington", "Yorkshire", "Aarons", "Applegate", "Armstrong", "Ashworth", "Atwater", "Babbage", "Baird", "Barclay", "Barton", "Baxter", "Beatty", "Bellamy", "Benson", "Bentley", "Bertram", "Bingham", "Bishop", "Blackburn", "Blakely", "Booth", "Boyd", "Bradshaw", "Bragg", "Brendon", "Bridger", "Brooke", "Browning", "Buchanan", "Burton", "Byrd", "Cadwallader", "Caldwell", "Campion", "Carrington", "Chambers", "Chandler", "Chapman", "Chesterton", "Cleveland", "Clifford", "Collier", "Connelly", "Conway", "Corbett", "Cormac", "Crawford", "Crosby", "Davenport", "Davison", "Dempsey", "Denison", "Digby", "Donnelly", "Donovan", "Drummond", "Dudley", "Dunbar", "Edison", "Ellington", "Fairfield", "Farrell", "Faulkner", "Fielding", "Fletcher", "Fordham", "Forrester", "Fowler", "Galloway", "Garner", "Garrison", "Gifford", "Goodrich", "Gordon", "Gould", "Graham", "Grantham", "Grey", "Grosvenor", "Hadfield", "Hale", "Harding", "Harrington", "Hartley", "Hathaway", "Hawley", "Hayden", "Hensley", "Hobson", "Holbrook", "Holland", "Hollis", "Hopkins", "Howe", "Ingram", "Irving", "Jardine", "Jenkinson", "Kingsley", "Kirkland", "Latham", "Lawrence", "Leighton", "Leland", "Leslie", "Livingstone", "Lockwood", "Longfellow", "Lowell", "Macaulay", "MacDonald", "MacGregor", "MacKenzie", "MacLeod", "MacPherson", "Maddox", "Manning", "Marlowe", "Mather", "Maxwell", "McAllister", "McArthur", "McCallum", "McClure", "McConnell", "McCormick", "McCracken", "McDaniel", "McDowell", "McFarlane", "McGill", "McGovern", "McGregor", "McGuire", "McIntosh", "McKay", "McKee", "McKenna", "McKenzie", "McKinley", "McLaren", "McLaughlin", "McLean", "McLeod", "McMahon", "McMillan", "McMullin", "McNally", "McQueen", "Meadows", "Middleton", "Milton", "Monaghan", "Montague", "Montgomery", "Moreland", "Morley", "Morton", "Mulligan", "Munro", "Napier", "Nash", "Newell", "Newland", "Newman", "Nightingale", "Norton", "Nugent", "Oakley", "O'Connell", "O'Donnell", "O'Hara", "O'Malley", "O'Reilly", "Paine", "Paloma", "Parnell", "Partridge", "Pemberton", "Pendleton", "Pennington", "Percival", "Piers", "Pritchard", "Radcliffe", "Raleigh", "Ramsey", "Randal", "Rawlings", "Redmond", "Reynolds", "Ridley", "Rigby", "Rochester", "Rutherford", "Rutledge", "Sandford", "Scarborough", "Sedgwick", "Shawcross", "Shepherd", "Sheridan", "Shirley", "Sinclair", "Slater", "Somerville", "Spaulding", "Standish", "Stanton", "Sterling", "Stevenson", "Stockton", "Stratford", "Sutherland", "Sutton", "Taggart", "Talbot", "Talley", "Tattersall", "Templeton", "Thackeray", "Thatcher", "Thornton", "Thurston", "Tierney", "Tippett", "Townsend", "Tremblay", "Truax", "Tudor", "Turnbull", "Underwood", "Vance", "Vaughan", "Vickers", "Waddington", "Wakefield", "Walden", "Waller", "Walton", "Warburton", "Wardell", "Warner", "Warwick", "Watkins", "Weatherby", "Webster", "Wellington", "Wentworth", "Westbrook", "Weston", "Wheatley", "Wheeler", "Whistler", "Whitcomb", "Whitehead", "Whittaker", "Wickham", "Wilder", "Wilkinson", "Willoughby", "Winchester", "Windsor", "Wingate", "Winslow", "Winterbottom", "Woodhouse", "Woodruff", "Woodward", "Worthington", "Wyatt", "Yardley", "Yeoman", "Youngblood", "Ziegler", "Zimmerman"];


let allGamesHistory = [];
let currentGameNumber = 0;
let isPlayer001VIP = false;
let player001VIP_Id = null;
let audioContext;
const allianceColors = [
    '#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd',
    '#ccebc5','#ffed6f','#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00'
];

// Easter Egg Data
const easterEggPlayersData = {
    1: { // This is a resolver function for the 50/50 chance
        resolve: () => {
            if (Math.random() < 0.5) {
                return { // Oh Il-nam
                    name: "Oh Il-nam",
                    personality: { age: 77, gender: "Male", country: "South Korea", occupation: "Retired", debt: 0 },
                    stats: { strength: 1, agility: 1, intelligence: 15, charisma: 10, luck: 10, cowardice: 2, greed: 10 },
                    photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/2/29/Oh-ll-nam_2020.png/revision/latest/scale-to-width/360?cb=20250126120528" 
                };
            } else { // Young-Il
                return {
                    name: "Young-Il",
                    personality: { age: 35, gender: "Male", country: "South Korea", occupation: "Investor", debt: 0 },
                    stats: { strength: 10, agility: 10, intelligence: 15, charisma: 10, luck: 10, cowardice: 0, greed: 10 },
                    photoUrl: "https://preview.redd.it/who-is-player-001-in-the-first-game-of-season-2-v0-rvhu1y3wb1ie1.jpeg?width=350&auto=webp&s=29a2aced0cd30e8fffbcb5ebbc0ffc2979d05da6" 
                };
            }
        }
    },
    7: {
        name: "Park Yong-sik",
        personality: { age: 39, gender: "Male", country: "South Korea", occupation: "Unemployed", debt: 210000 },
        stats: { strength: 5, agility: 4, intelligence: 5, charisma: 2, luck: 5, cowardice: 11, greed: 3 },
        photoUrl: "https://i.redd.it/here-is-what-i-think-will-happen-to-player-007-yong-sik-and-v0-km4tveirmyre1.jpg?width=1079&format=pjpg&auto=webp&s=c50bbe2a5061a08a287363c2ea8ea67d37e0144e" // FILLER URL
    },
    44: {
        name: "Seon-Nyeo",
        personality: { age: 49, gender: "Female", country: "South Korea", occupation: "Shaman", debt: 100000 },
        stats: { strength: 4, agility: 5, intelligence: 8, charisma: 15, luck: 10, cowardice: 6, greed: 10 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/b/bd/Player044_N.jpg/revision/latest/scale-to-width-down/1200?cb=20250630194513" 
    },
    67: { 
        name: "Kang Sae-byeok",
        personality: { age: 23, gender: "Female", country: "North Korea", occupation: "Defector / Pickpocket", debt: 40000 },
        stats: { strength: 5, agility: 7, intelligence: 9, charisma: 1, luck: 6, cowardice: 2, greed: 5 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/f/f4/Kang_Sae-byeok.png/revision/latest?cb=20250916115418" 
    },
    95: { 
        name: "Young-Mi", 
        personality: { age: 25, gender: "Female", country: "South Korea", occupation: "Unemployed", debt: 25000 },
        stats: { strength: 2, agility: 7, intelligence: 5, charisma: 3, luck: 3, cowardice: 8, greed: 1 },
        photoUrl: "https://s.yimg.com/ny/api/res/1.2/Q65_OCPdL6TAYMYKJbLJjw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02OTk7Y2Y9d2VicA--/https://media.zenfs.com/en/mandatory_995/2f5b7e255575ae8da68b2ecf38f55f23" 
    },
    100: {
        name: "Im Jeong-dae",
        personality: { age: 29, gender: "Male", country: "South Korea", occupation: "Businessman", debt: 10000000 },
        stats: { strength: 3, agility: 3, intelligence: 8, charisma: 15, luck: 8, cowardice: 8, greed: 13 },
        photoUrl: "https://preview.redd.it/unpopular-opinion-i-think-player-100-was-one-of-the-v0-ieux3msf8ehf1.jpeg?auto=webp&s=6ce6586ac7aab1729a1d7ffe1d8f66f6b3fad4c3" 
    },
    101: { 
        name: "Jang Deok-su", 
        personality: { age: 44, gender: "Male", country: "South Korea", occupation: "Gangster", debt: 1200000 },
        stats: { strength: 11, agility: 6, intelligence: 5, charisma: 8, luck: 6, cowardice: 2, greed: 10 },
        photoUrl: "https://64.media.tumblr.com/800b77c51be892235c9ae3de67816d7e/95093e286c64ebfb-21/s540x810/15e869f7e9766a7068ee446efd2e0a7a96af7b73.gif" 
    },
    111: { 
        name: "Byeon-gi", 
        personality: { age: 44, gender: "Male", country: "South Korea", occupation: "Doctor", debt: 1100000 },
        stats: { strength: 8, agility: 8, intelligence: 8, charisma: 8, luck: 6, cowardice: 3, greed: 10 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/6/6f/Byeong-gi.png/revision/latest?cb=20240216074508" 
    },
    120: {
        name: "Cho Hyun-Ju",
        personality: { age: 38, gender: "Male", country: "South Korea", occupation: "Former Marine", debt: 330000 },
        stats: { strength: 10, agility: 10, intelligence: 10, charisma: 6, luck: 5, cowardice: 0, greed: 3 },
        photoUrl: "https://i.pinimg.com/236x/0a/c9/ae/0ac9ae623a2f70a0b61c613c4637fc78.jpg" 
    },
    124: {
        name: "Nam-su",
        personality: { age: 31, gender: "Male", country: "South Korea", occupation: "Security Guard", debt: 150000 },
        stats: { strength: 6, agility: 6, intelligence: 5, charisma: 3, luck: 5, cowardice: 1, greed: 10 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/d/df/Player124_n.jpg/revision/latest/thumbnail/width/360/height/450?cb=20250211122522" 
    },
    125: {
        name: "Park Min-su",
        personality: { age: 25, gender: "Male", country: "South Korea", occupation: "Office Worker", debt: 65000 },
        stats: { strength: 3, agility: 8, intelligence: 5, charisma: 1, luck: 8, cowardice: 11, greed: 1 },
        photoUrl: "https://i.pinimg.com/236x/68/47/4b/68474b21217a95102808aec76ffd6757.jpg" // FILLER URL
    },
    149: {
        name: "Jang Geum-Ja",
        personality: { age: 70, gender: "Female", country: "South Korea", occupation: "Midwife", debt: 0 },
        stats: { strength: 2, agility: 5, intelligence: 7, charisma: 5, luck: 9, cowardice: 2, greed: 0 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/5/52/JangGeum-ja.png/revision/latest?cb=20250103030318" 
    },
    199: { 
        name: "Ali Abdul", 
        personality: { age: 33, gender: "Male", country: "Pakistan", occupation: "Factory Worker", debt: 5000 },
        stats: { strength: 10, agility: 7, intelligence: 6, charisma: 9, luck: 4, cowardice: 5, greed: 1 },
        photoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/bd/Ali_Abdul_Squid_Game.jpg/250px-Ali_Abdul_Squid_Game.jpg" 
    },
    212: { 
        name: "Han Mi-nyeo", 
        personality: { age: 46, gender: "Female", country: "South Korea", occupation: "Fraudster", debt: 200000 },
        stats: { strength: 4, agility: 8, intelligence: 6, charisma: 9, luck: 9, cowardice: 2, greed: 7 },
        photoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2a/Han_Mi-nyeo.png" 
    },
    218: { 
        name: "Cho Sang-woo", 
        personality: { age: 46, gender: "Male", country: "South Korea", occupation: "Head of Securities", debt: 4700000 },
        stats: { strength: 6, agility: 6, intelligence: 11, charisma: 3, luck: 8, cowardice: 2, greed: 11 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/8/8f/Sang-woo_during_red_light_green_light.jpg/revision/latest/scale-to-width-down/736?cb=20250105033101" 
    },
    222: {
        name: "Kim Jun-hee",
        personality: { age: 28, gender: "Female", country: "South Korea", occupation: "Unemployed", debt: 100000 },
        stats: { strength: 3, agility: 5, intelligence: 5, charisma: 4, luck: 5, cowardice: 6, greed: 1 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/c/c5/Player222.jpg/revision/latest/scale-to-width-down/250?cb=20241110155810"
    },
    226: { 
        name: "Kim Yeong-Sam", 
        personality: { age: 46, gender: "Male", country: "South Korea", occupation: "Employed", debt: 1900000 },
        stats: { strength: 6, agility: 8, intelligence: 7, charisma: 9, luck: 5, cowardice: 2, greed: 10 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/5/5a/KimYeong-sam1.png/revision/latest?cb=20241229032549" 
    },
    230: {
        name: "Thanos",
        personality: { age: 24, gender: "Male", country: "South Korea", occupation: "Rapper", debt: 75000 },
        stats: { strength: 5, agility: 6, intelligence: 7, charisma: 9, luck: 6, cowardice: 4, greed: 8 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/8/88/Thanos_Player_Picture.jpg/revision/latest/thumbnail/width/360/height/450?cb=20250528110557" 
    },
    333: {
        name: "Lee Myung-gi",
        personality: { age: 49, gender: "Male", country: "South Korea", occupation: "YouTuber", debt: 800000 },
        stats: { strength: 7, agility: 7, intelligence: 9, charisma: 1, luck: 7, cowardice: 0, greed: 10 },
        photoUrl: "https://cdn.polyspeak.ai/speakmaster/9e6636f6fee739075903b5196b8bd7ae.webp"
    },
    380: { 
        name: "Han Se-Mi", 
        personality: { age: 25, gender: "Female", country: "South Korea", occupation: "Makeup Artist", debt: 200000 },
        stats: { strength: 4, agility: 8, intelligence: 6, charisma: 7, luck: 3, cowardice: 2, greed: 5 },
        photoUrl: "https://preview.redd.it/opinions-on-380-v0-h0zkrchy899e1.jpeg?auto=webp&s=1fc0904560bbd8156edbe7346884cab0a26e4f56" 
    },
    388: {
        name: "Kang Dae-Ho",
        personality: { age: 34, gender: "Male", country: "South Korea", occupation: "Unemployed", debt: 45000 },
        stats: { strength: 6, agility: 7, intelligence: 5, charisma: 6, luck: 5, cowardice: 10, greed: 3 },
        photoUrl: "https://static.wikia.nocookie.net/thesquidgame/images/d/d3/DaeHo388.png/revision/latest/scale-to-width-down/250?cb=20250705181447" // FILLER URL
    },
    390: {
        name: "Park Jung-bae",
        personality: { age: 41, gender: "Male", country: "South Korea", occupation: "Small Business Owner", debt: 110000 },
        stats: { strength: 6, agility: 6, intelligence: 8, charisma: 9, luck: 6, cowardice: 1, greed: 2 },
        photoUrl: "https://shapes.inc/api/public/avatar/parkjungbae" // FILLER URL
    },
    456: { 
        name: "Seong Gi-hun", 
        personality: { age: 47, gender: "Male", country: "South Korea", occupation: "Chauffeur (Unemployed)", debt: 340000 },
        stats: { strength: 7, agility: 8, intelligence: 6, charisma: 7, luck: 15, cowardice: 1, greed: 1 },
        photoUrl: "https://upload.wikimedia.org/wikipedia/en/c/c1/Seong_Gi-hun_season_1.png" 
    }
};

// NEW: Manual Easter Egg character data (merged)
const manualEasterEggData = {
    1: easterEggPlayersData[1], // Uses the resolver
    7: { // Using explicit ID slot for non-sequential character
        name: "Park Yong-sik",
        personality: { age: 39, gender: "Male", country: "South Korea", occupation: "Unemployed", debt: 210000 },
        stats: { strength: 5, agility: 4, intelligence: 5, charisma: 2, luck: 5, cowardice: 11, greed: 3 },
        photoUrl: easterEggPlayersData[7].photoUrl
    },
    44: easterEggPlayersData[44],
    67: easterEggPlayersData[67],
    95: easterEggPlayersData[95],
    100: easterEggPlayersData[100],
    101: easterEggPlayersData[101],
    111: easterEggPlayersData[111],
    120: easterEggPlayersData[120],
    124: easterEggPlayersData[124],
    125: easterEggPlayersData[125],
    149: easterEggPlayersData[149],
    199: easterEggPlayersData[199],
    212: easterEggPlayersData[212],
    218: easterEggPlayersData[218],
    222: easterEggPlayersData[222],
    226: easterEggPlayersData[226],
    230: easterEggPlayersData[230],
    333: easterEggPlayersData[333],
    380: easterEggPlayersData[380],
    388: easterEggPlayersData[388],
    390: easterEggPlayersData[390],
    456: easterEggPlayersData[456]
};

let usedEasterEggIds = new Set();



function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}
document.body.addEventListener('click', initAudio, { once: true });

function playSound(type) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'start':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
            break;
        case 'elimination':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
            break;
        case 'win':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1.0);
            break;
        case 'click':
                oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
            break;
    }
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
}

// --- Centralized Function to Get Active Players ---
function getActivePlayers() {
    return players.filter(p => !p.eliminated && !p.votedOut && !p.isBaby);
}

function createSaveObject() {
        return {
        // NEW: Add this line to save photos
        customPlayerPhotos: customPlayerPhotos,
        // Core Game State
        players: players,
        round: round,
        currentGameNumber: currentGameNumber,
        currentPrizePot: currentPrizePot,
        firstEliminationOfGame: firstEliminationOfGame,


        // Player Groupings (converted from Sets to Arrays)
        personalityPlayers: Array.from(personalityPlayers),
        superpoweredPlayerIds: Array.from(superpoweredPlayerIds),
        usedEasterEggIds: Array.from(usedEasterEggIds),
        favoritedPlayerIds: Array.from(favoritedPlayerIds), 

        // UI & Mode Toggles
        eliminatedHidden: eliminatedHidden,
        showGroups: showGroups,
        season2ModeActive: season2ModeActive,
        showVoteColors: showVoteColors,
        
        // Season 2 / Voting
        votingRoundCount: votingRoundCount,

        // Alliances & Relations
        allianceGroupColors: persistentGroupColors,

        // History & Tracking
        eliminationOrder: eliminationOrder,
        allGamesHistory: allGamesHistory, // For winner history
        gameHistorySnapshots: gameHistorySnapshots,
        
        // VIP / Betting
        bettingBalance: bettingBalance,
        isGameModified: isGameModified,
        currentBets: currentBets,

        // Events
        usedEvents: Array.from(usedEvents),
        
        // Game Creator
        customGames: customGames,

        // VIP Player
        isPlayer001VIP: isPlayer001VIP,
        player001VIP_Id: player001VIP_Id,

        // Achievements
        achievements: achievements,
    };
}

// --- NEW: SAVE/LOAD FUNCTIONS ---

function saveGame() {
    if (isViewingArchivedGame) {
        alert("Cannot save while viewing an archived game. Please return to the live session first.");
        return;
    }
    if (isViewingHistory) {
        alert("Please 'Return to Live' before saving the game state.");
        return;
    }

    const saveData = createSaveObject();

    try {
        const dataStr = JSON.stringify(saveData);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        a.href = url;
        a.download = `squid-game-save-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        logEvent("Game state saved successfully.");
    } catch (error) {
        console.error("Error saving game:", error);
        alert("Could not save game state. There might be a data issue. Check the console for details.");
    }
}

function loadGame(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedData = JSON.parse(e.target.result);
            restoreGameState(loadedData);
            // logEvent is cleared by restore, so alert is better
            alert("Game state loaded successfully.");

        } catch (error) {
            alert("Failed to load game state. The file may be corrupted or invalid.");
            console.error("Error loading game:", error);
        } finally {
            // Reset file input to allow loading the same file again
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// --- END SAVE/LOAD ---

// --- NEW Favorite Player Functions ---
function toggleFavoritePlayer(playerId) {
    if (isViewingArchivedGame) {
        alert("Cannot change favorites while viewing an archived game.");
        return;
    }
    if (isViewingHistory) {
        alert("Cannot change favorites while viewing history. Please Return to Live.");
        return;
    }
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    player.isFavorite = !player.isFavorite;

    if (player.isFavorite) {
        favoritedPlayerIds.add(playerId);
    } else {
        favoritedPlayerIds.delete(playerId);
    }
    
    // Refresh UI
    updateFavoritedPlayersList();
    updateAllPlayerDivs(); // This updates the blip's highlight
    showPlayerCard(playerId); // Re-opens/refreshes the card to show the new star state
}

function updateFavoritedPlayersList() {
    const list = document.getElementById('favoritedPlayersList');
    if (!list) return; // Guard for safety
    list.innerHTML = '';

    const currentPlayersArray = isViewingHistory 
        ? gameHistorySnapshots[document.getElementById('historySlider').value].players
        : players;
    
    // In history view, we must derive `isFavorite` status from the snapshot's data
    const historicalFavoriteIds = new Set(
        currentPlayersArray.filter(p => p.isFavorite).map(p => p.id)
    );

    historicalFavoriteIds.forEach(id => {
        const p = currentPlayersArray.find(player => player.id === id);
        if (p) {
            let status;
            if (p.votedOut) {
                let reason = p.roundVotedOut === 'Escaped' ? 'Escaped' : `VR ${p.roundVotedOut || 'N/A'}`;
                status = `Out (${reason})`;
            } else if (p.eliminated) {
                status = `Eliminated (GR ${p.eliminationRound || 'N/A'})`;
            } else {
                status = 'In Game';
            }

            const nameDisplay = p.name ? `(${p.name})` : '';
            const li = document.createElement('li');
            li.innerHTML = `${createPlayerLink(p.id)} ${nameDisplay} - <i>${status}</i>`;
            list.appendChild(li);
        }
    });
}

// Centralized function to update lists in the personality tab
function updateAllCustomLists() {
    updateAllPersonalityLists();
    updateFavoritedPlayersList();
}


// --- END Favorite Player Functions ---

// NEW: Centralized function to credit a player for an elimination
function creditElimination(killerId, victimId) {
    if (!killerId) return;
    const killer = players.find(p => p.id === killerId);
    if (killer) {
        if (!killer.eliminationsByPlayer) killer.eliminationsByPlayer = 0;
        killer.eliminationsByPlayer++;
    }
}

// NEW: Centralized function to update a player's highest ally count
function updateHighestAllyCount(player) {
    if (!player) return;
    if (!player.highestAllyCount) player.highestAllyCount = 0;
    const currentAllyCount = player.allies ? player.allies.length : 0;
    if (currentAllyCount > player.highestAllyCount) {
        player.highestAllyCount = currentAllyCount;
    }
}

function getEffectiveStat(p, stat) {
    let baseValue = p.baseStats[stat] || 0;
    let boostValue = p.allianceBoost[stat] || 0;
    let effectiveStat = baseValue + boostValue;

    if (p.injury) {
        if (stat === 'strength' || stat === 'agility') {
            effectiveStat -= 2;
        }
        if (stat === 'cowardice') {
            effectiveStat += p.injury.cowardiceDebuff;
        }
    }

    if (stat === 'cowardice' || stat === 'greed' || stat === 'debt') {
        return effectiveStat; 
    }
    
    return Math.max(1, effectiveStat);
};

function getWeightedRandom(array, weights) {
    if (array.length === 0) return null;
    let sum = 0;
    const cumulativeWeights = weights.map(w => sum += w);
    const random = Math.random() * sum;
    const index = cumulativeWeights.findIndex(weight => weight > random);
    return array[index];
}
function getDebt() {
    const ranges = [
        { max: 100000, w: 50 },
        { max: 500000, w: 30 },
        { max: 2000000, w: 15 },
        { max: 10000000, w: 5 }
    ];
    const range = getWeightedRandom(ranges, ranges.map(r => r.w));
    return Math.floor(Math.random()*(range.max-1000))+1000;
}
function formatPlayerNumber(num) { return num.toString().padStart(3, '0'); }
function formatCurrency(amount) { 
    const prefix = '$';
    return prefix + amount.toLocaleString('en-US'); 
}

function createPlayerLink(playerId) {
    return `<span class="player-link" onclick="showPlayerCard(${playerId})">P${formatPlayerNumber(playerId)}</span>`;
}

function linkifyPlayerNumbers(text) {
    if (!text) return '';
    return text.replace(/\bP(\d{1,3})\b/g, (match, p1) => {
        const id = parseInt(p1, 10);
        const currentPlayersArray = (isViewingHistory || isViewingArchivedGame) && gameHistorySnapshots.length > 0
            ? gameHistorySnapshots[document.getElementById('historySlider').value].players
            : players;
        const playerExists = currentPlayersArray.some(p => p.id === id);
        if (playerExists) {
            return createPlayerLink(id);
        }
        return match;
    });
}

function logEvent(message, details = null) {
    const logList = document.getElementById('gameLogList');
    const listItem = document.createElement('li');
    
    let html = message;
    if (details) {
        const detailId = `details-log-${Date.now()}-${Math.random()}`;
        html += ` <button class="log-details-toggle" onclick="toggleLogDetails('${detailId}')">View Details</button>`;
        html += `<div class="expandable" id="${detailId}">${linkifyPlayerNumbers(details)}</div>`;
    }

    listItem.innerHTML = linkifyPlayerNumbers(html);
    logList.appendChild(listItem);
    logList.scrollTop = logList.scrollHeight;
}

function toggleLogDetails(detailId) {
    const detailBox = document.getElementById(detailId);
    if (detailBox) {
        detailBox.style.display = detailBox.style.display === 'none' ? 'block' : 'none';
    }
}

function setGameAsModified() {
    if (!isGameModified) {
        isGameModified = true;
        updateVipTab();
    }
}

function toggleSeason2Mode() {
    if (isViewingArchivedGame) return;
    season2ModeActive = !season2ModeActive;
    const toggleBtn = document.getElementById('season2ToggleBtnInTab');
    
    // Update the button's text and style
    toggleBtn.textContent = season2ModeActive ? 'Voting Mode is ON' : 'Voting Mode is OFF';
    toggleBtn.style.backgroundColor = season2ModeActive ? '#28a745' : '';
    toggleBtn.style.color = season2ModeActive ? 'white' : '';

    // Disable voting actions if mode is turned off
    document.querySelector('#votingBox button[onclick="startVotingRound()"]').disabled = !season2ModeActive;
    document.getElementById('toggleVoteColorsBtn').disabled = !season2ModeActive;
    
    if (!season2ModeActive) {
        showVoteColors = false; 
        document.getElementById('toggleVoteColorsBtn').innerText = "Show Vote Colors";
        clearVoteColorsFromPlayers();
    }
    updateAllPlayerDivs();
    updateStatistics(); 
}

function toggleVoteColors() {
    if (isViewingArchivedGame) return;
    if (!season2ModeActive) { alert("Season 2 Mode is not active."); return; }
    showVoteColors = !showVoteColors;
    document.getElementById('toggleVoteColorsBtn').innerText = showVoteColors ? "Hide Vote Colors" : "Show Vote Colors";
    updateAllPlayerDivs();
}

function toggleGroupView() {
    // if (isViewingArchivedGame) return; // REMOVED THIS LINE
    showGroups = !showGroups;
    document.getElementById('toggleGroupBtn').innerText = showGroups ? "Hide Groups" : "Show Groups";
    updateAllPlayerDivs();
}


function clearVoteColorsFromPlayers() {
    players.forEach(player => {
        const playerDiv = document.getElementById(`player-${player.id}`);
        if (playerDiv) playerDiv.classList.remove('voted-o', 'voted-x');
    });
}

function calculateGridPositions(playersToLayout) {
    gridPositions = {}; // Always clear old positions
    const numPlayers = Array.isArray(playersToLayout) ? playersToLayout.length : playersToLayout;

    // --- Layout parameters ---
    const DIAMOND_SIZE = 36;
    const DIAMOND_GAP = 8;
    const X_STEP = DIAMOND_SIZE + DIAMOND_GAP;
    const Y_STEP = (DIAMOND_SIZE + DIAMOND_GAP) / 2;
    const BORDER_PADDING = 40;
    // --------------------------------------------------------

    let widestRow = Math.ceil(Math.sqrt(numPlayers));
    let totalRows = widestRow * 2 - 1;

    let playersContainer = document.getElementById('players');
    let containerWidth = (widestRow * X_STEP) + BORDER_PADDING;
    let containerHeight = (totalRows * Y_STEP) + BORDER_PADDING;
    playersContainer.style.width = containerWidth + 'px';
    playersContainer.style.height = containerHeight + 'px';

    let currentPlayerIndex = 0; 
    const playerArray = Array.isArray(playersToLayout) ? playersToLayout : players;

    for (let r = 1; r <= totalRows; r++) {
        let numColsInRow = r <= widestRow ? r : widestRow * 2 - r;
        for (let c = 1; c <= numColsInRow; c++) {
            if (currentPlayerIndex >= numPlayers) break;
            
            const player = playerArray[currentPlayerIndex];
            
            const yPos = (r - 1) * Y_STEP + Y_STEP;
            const xPos = (containerWidth / 2) + (c - (numColsInRow + 1) / 2) * X_STEP;
            
            if (player) {
                gridPositions[player.id] = { x: xPos, y: yPos };
            }
            currentPlayerIndex++;
        }
        if (currentPlayerIndex >= numPlayers) break;
    }
}


function updateAllPlayerDivs() {
    const playersContainer = document.getElementById('players');
    playersContainer.innerHTML = ''; 

    // 1. Determine view mode and recalculate grid immediately
    let playersToDraw;
    if (isCompactedView) {
        // Compact Mode: Only active players, tight grid
        playersToDraw = getActivePlayers();
        calculateGridPositions(playersToDraw);
    } else {
        // Full/Restore Mode: All players (including eliminated), full grid
        playersToDraw = players;
        calculateGridPositions(playersToDraw);
    }

    // 2. Setup colors if groups are active
    if (showGroups) {
        let availableColors = [...allianceColors];
        
        const activeGroupIds = new Set();
        const currentPlayersForGrouping = isViewingHistory || isViewingArchivedGame ? players : getActivePlayers();
        
        currentPlayersForGrouping.forEach(p => {
            if (p.allies && p.allies.length > 0) {
                const sortedAllies = [p.id, ...p.allies].sort((a,b) => a-b);
                const groupId = sortedAllies.join('-');
                activeGroupIds.add(groupId);
            }
        });
        
        for (const groupId in persistentGroupColors) {
            if (!activeGroupIds.has(groupId)) {
                delete persistentGroupColors[groupId];
            }
        }

        Object.values(persistentGroupColors).forEach(color => {
            const index = availableColors.indexOf(color);
            if (index > -1) availableColors.splice(index, 1);
        });
        
        const getNextColor = () => {
            if(availableColors.length === 0) availableColors = [...allianceColors]; 
            return availableColors.shift();
        };

        activeGroupIds.forEach(groupId => {
            if (!persistentGroupColors[groupId]) {
                persistentGroupColors[groupId] = getNextColor();
            }
        });
    }

    // 3. Draw the players based on the mode
    playersToDraw.sort((a, b) => a.id - b.id).forEach(p => {
        let playerDiv = document.createElement('div');
        playerDiv.id = `player-${p.id}`;
        
        const photoURL = customPlayerPhotos[p.id];
        let numberClasses = [];
        
        if (photoURL) {
            const desiredImageRotation = '-135deg'; 
            
            const imageContent = `
                <div class="player-image-container">
                    <img src="${photoURL}" style="transform: rotate(${desiredImageRotation});">
                </div>
            `;
            playerDiv.innerHTML = imageContent;
            numberClasses.push('player-text-shadow');
            playerDiv.style.backgroundColor = 'transparent';
            playerDiv.style.backgroundImage = 'none'; 
        } else {
            playerDiv.innerHTML = '';
            playerDiv.style.backgroundImage = 'none';
        }
        
        const numberContent = p.isBaby
            ? `<span class="player-baby-icon">👶</span>`
            : `<span class="player-number ${numberClasses.join(' ')}">${formatPlayerNumber(p.id)}</span>`;
        
        playerDiv.innerHTML += numberContent;

        // 4. Positioning (using the map we just recalculated in Step 1)
        if (gridPositions[p.id]) {
            playerDiv.style.top = gridPositions[p.id].y + 'px';
            playerDiv.style.left = gridPositions[p.id].x + 'px';
        }
        
        // 5. Setup event listeners
        playerDiv.onmouseenter = (e) => {
            showPlayerTooltip(p.id, e);
            if (showGroups && p.allies && p.allies.length > 0) {
                const group = [p.id, ...p.allies];
                group.forEach(allyId => {
                    const allyDiv = document.getElementById(`player-${allyId}`);
                    if(allyDiv) allyDiv.classList.add('group-highlight');
                });
            }
        };
        playerDiv.onmouseleave = () => {
            hidePlayerTooltip();
            if (showGroups && p.allies && p.allies.length > 0) {
                const group = [p.id, ...p.allies];
                group.forEach(allyId => {
                    const allyDiv = document.getElementById(`player-${allyId}`);
                    if(allyDiv) allyDiv.classList.remove('group-highlight');
                });
            }
        };
        playerDiv.onclick = () => showPlayerCard(p.id);

        // 6. Apply classes and colors
        let classes = ['player'];
        playerDiv.style.backgroundColor = ''; 
        playerDiv.style.boxShadow = '';

        if (p.votedOut) {
            classes.push('voted-out');
            if (isPlayer001VIP && p.id === player001VIP_Id) {
                classes.push('player-vip-eliminated');
            }
        } else if (p.eliminated) {
            if (p.wasFinalistWhenEliminated) {
                classes.push('eliminated-finalist');
            } else if (p.isPreviousWinner) {
                classes.push('purple');
            } else if (isPlayer001VIP && p.id === player001VIP_Id) {
                classes.push('player-vip-eliminated');
            } else if (superpoweredPlayerIds.has(p.id) || personalityPlayers.has(p.id)) {
                classes.push('purple');
            } else {
                classes.push('eliminated');
            }
        } else { // Player is Active
            if (p.caretakerFor) { 
                classes.push('player-caretaker');
            } else if (p.isPreviousWinner) {
                classes.push('purple');
            } else if (p.isEasterEgg) {
                classes.push('player-easter-egg');
            }
            if (p.isWinner) {
                classes.push('winner');
            } else if (p.isFinalist) {
                classes.push('finalist');
            } else if (showVoteColors && season2ModeActive && p.currentVote) {
                classes.push(p.currentVote === 'O' ? 'voted-o' : 'voted-x');
            } else if (!p.isEasterEgg && (superpoweredPlayerIds.has(p.id) || personalityPlayers.has(p.id))) {
                classes.push('dark-pink');
            }

            if (p.injury) {
                playerDiv.style.boxShadow = '0 0 10px 3px red';
            }

            if (isPlayer001VIP && p.id === player001VIP_Id) {
                classes.push('player-vip');
            }

            if (p.isPregnant) {
                classes.push('player-pregnant');
            }
        }

        if (showGroups && !p.eliminated && !p.votedOut) {
            const hasAllies = p.allies && p.allies.length > 0;
            
            if(hasAllies) {
                const sortedAllies = [p.id, ...p.allies].sort((a,b) => a-b);
                const groupId = sortedAllies.join('-');
                if (!p.caretakerFor) {
                    playerDiv.style.backgroundColor = persistentGroupColors[groupId] || '';
                }
            } 
            if (!hasAllies && !isCompactedView) {
                classes.push('faded-group-view');
            }
        }
        
        if (!isCompactedView && (p.eliminated || p.votedOut) && eliminatedHidden) {
            classes.push('hidden-eliminated');
        }

        if (p.isFavorite) {
            classes.push('player-favorite-highlight');
        }
        playerDiv.className = classes.join(' ');
        playersContainer.appendChild(playerDiv);
    });
}


function toggleEliminatedVisibility() {
    if (isViewingArchivedGame) return;
    eliminatedHidden = !eliminatedHidden;
    document.getElementById('toggleEliminatedBtn').innerText = eliminatedHidden ? 'Show Eliminated/Out' : 'Hide Eliminated/Out';
    updateAllPlayerDivs();
}

function updateStatsBlock(containerId) {
    const activePlayers = getActivePlayers();
    const totalDebt = activePlayers.reduce((sum, p) => sum + p.debt, 0);
    const averageDebt = activePlayers.length > 0 ? totalDebt / activePlayers.length : 0;
    
    const sortedByDebt = [...activePlayers].sort((a, b) => b.debt - a.debt);
    let mostDebtPlayerHTML = 'N/A';
    if (sortedByDebt.length > 0) {
        const player = sortedByDebt[0];
        mostDebtPlayerHTML = `${createPlayerLink(player.id)} (${formatCurrency(player.debt)})`;
    }

    let html = `<p><strong>Current Prize Pot:</strong> <span id="statsPrizePot${containerId}">${formatCurrency(currentPrizePot)}</span></p>
                <p><strong>Total Debt:</strong> ${formatCurrency(totalDebt)}</p>
                <p><strong>Average Debt:</strong> ${formatCurrency(Math.round(averageDebt))}</p>
                <p><strong>Remaining Players:</strong> <span id="statsPlayersRemaining${containerId}">${activePlayers.length}</span></p>
                <p><strong>Male Players:</strong> <span id="statsMale${containerId}">${activePlayers.filter(p => p.gender === 'Male').length}</span></p>
                <p><strong>Female Players:</strong> <span id="statsFemale${containerId}">${activePlayers.filter(p => p.gender === 'Female').length}</span></p>
                <p><strong>Current Round:</strong> <span id="statsCurrentRound${containerId}">${round}</span></p>`;
    if (season2ModeActive) {
        html += `<div id="s2Stats${containerId}">
                    <p><strong>Voted 'O' (Stay):</strong> <span id="statsVotedO${containerId}">${activePlayers.filter(p => p.currentVote === 'O').length}</span></p>
                    <p><strong>Voted 'X' (Leave):</strong> <span id="statsVotedX${containerId}">${activePlayers.filter(p => p.currentVote === 'X').length}</span></p>
                </div>`;
    }
        html += `<h4>Leaderboards</h4>
            <div id="leaderboards${containerId}">
                <p><strong>Most Kills:</strong> <span id="leaderboardKills${containerId}">N/A</span></p>
                <p><strong>Most Feared:</strong> <span id="leaderboardFeared${containerId}">N/A</span></p>
                <p><strong>Most Respected:</strong> <span id="leaderboardRespected${containerId}">N/A</span></p>
                <p><strong>Most Debt:</strong> ${mostDebtPlayerHTML}</p>
                <p><strong>Weakest Player:</strong> <span id="leaderboardWeakest${containerId}">N/A</span></p>
            </div>`;
    document.getElementById(containerId).innerHTML = html;
    updateLeaderboards(containerId);
}

function updateStatistics() {
    updateStatsBlock('statisticsContent');
    if (season2ModeActive) {
        updateStatsBlock('votingStatsContent');
    }
}

function getPlayerFearScore(p) {
    return (getEffectiveStat(p, 'strength') + getEffectiveStat(p, 'agility') + getEffectiveStat(p, 'intelligence') + getEffectiveStat(p, 'charisma') + getEffectiveStat(p, 'luck') + getEffectiveStat(p, 'greed')) - getEffectiveStat(p, 'cowardice');
}

function updateLeaderboards(containerId = 'statisticsContent') {
    const activePlayers = getActivePlayers();
    const killsEl = document.getElementById(`leaderboardKills${containerId}`);
    const fearedEl = document.getElementById(`leaderboardFeared${containerId}`);
    const respectedEl = document.getElementById(`leaderboardRespected${containerId}`);
    const weakestEl = document.getElementById(`leaderboardWeakest${containerId}`);

    if (activePlayers.length === 0 || !fearedEl) {
            if(fearedEl) {
            fearedEl.innerHTML = 'N/A';
            respectedEl.innerHTML = 'N/A';
            weakestEl.innerHTML = 'N/A';
            }
            if(killsEl) killsEl.innerHTML = 'N/A';
        return;
    }
    
    // Kills Leaderboard (considers all players, alive or dead)
    const allPlayersWithKills = players.filter(p => (p.eliminationsByPlayer || 0) > 0);
    allPlayersWithKills.sort((a,b) => (b.eliminationsByPlayer || 0) - (a.eliminationsByPlayer || 0));
    killsEl.innerHTML = allPlayersWithKills.length > 0
        ? allPlayersWithKills.slice(0, 3).map(p => `${createPlayerLink(p.id)} (${p.eliminationsByPlayer})`).join(', ') 
        : 'N/A';

    // Other leaderboards (active players only)
    const sortedByFear = [...activePlayers].sort((a,b) => getPlayerFearScore(b) - getPlayerFearScore(a));
    const sortedByRespect = [...activePlayers].sort((a,b) => (getEffectiveStat(b, 'charisma') + getEffectiveStat(b, 'intelligence')) - (getEffectiveStat(a, 'charisma') + getEffectiveStat(a, 'intelligence')));
    const sortedByWeakness = [...activePlayers].sort((a,b) => ((getEffectiveStat(b,'cowardice') * 1.5) - (getEffectiveStat(b,'strength') + getEffectiveStat(b,'luck') + getEffectiveStat(b,'intelligence'))) - ((getEffectiveStat(a,'cowardice') * 1.5) - (getEffectiveStat(a,'strength') + getEffectiveStat(a,'luck') + getEffectiveStat(a,'intelligence'))));
    
    fearedEl.innerHTML = sortedByFear.slice(0, 3).map(p => createPlayerLink(p.id)).join(', ');
    respectedEl.innerHTML = sortedByRespect.slice(0, 3).map(p => createPlayerLink(p.id)).join(', ');
    weakestEl.innerHTML = sortedByWeakness.slice(0, 1).map(p => createPlayerLink(p.id)).join('');
}


function showPlayerTooltip(playerId, event) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const tooltip = document.getElementById('playerTooltip');
    let info = `Player ${formatPlayerNumber(playerId)}`;
    if (player.name) info += ` (${player.name})`;
    info += "\n(Click player diamond for dossier)\n";

    if (player.isPreviousWinner) info += "[Previous Winner]\n";
    if (player.isEasterEgg) info += "[Special Character]\n";
    if (isPlayer001VIP && player.id === player001VIP_Id) info += "[VIP Player]\n";
    if (player.caretakerFor) info += `[Caretaker for P${formatPlayerNumber(player.caretakerFor)}]\n`;
    if (player.isBaby) info += `[Has Caretaker: P${formatPlayerNumber(player.hasCaretaker)}]\n`;
    if (player.isPregnant) info += "[Pregnant]\n";
    
    if (player.injury) {
        info += `Status: INJURED (${player.injury.type}, ${player.injury.roundsRemaining} round${player.injury.roundsRemaining > 1 ? 's' : ''} left)\n`;
    } else if (player.votedOut) {
        let reason = player.roundVotedOut === 'Escaped' ? 'Escaped' : `VR ${player.roundVotedOut || 'N/A'}`;
        info += `Status: Out of Game (${reason})\n`;
    } else if (player.eliminated) {
        info += `Status: Eliminated (GR ${player.eliminationRound || 'N/A'})\n`;
    } else {
        info += `Status: Still in game\n`;
    }
    
    info += `Protection: ${player.protection}\n`;
    if (player.hasHint) info += `Hinted for Next Game\n`;
    
    tooltip.innerHTML = info.replace(/\n/g, '<br>');
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10 - window.scrollY) + 'px';
}

function hidePlayerTooltip() { document.getElementById('playerTooltip').style.display = 'none'; }

function updateEventButtons() {
    const eventButtons = document.querySelectorAll('#events-controls button');
    eventButtons.forEach(button => {
        const eventName = button.id.split('-')[1];
        if (eventName !== 'random') {
            button.disabled = usedEvents.has(eventName) || isViewingArchivedGame;
        }
    });
}

function clearAdvancedSettings() {
    document.getElementById('advCountry').value = '';
    document.getElementById('advFemaleCount').value = ''; // CHANGED
    document.getElementById('advMaleCount').value = '';
    document.getElementById('advAgeMin').value = '';
    document.getElementById('advAgeMax').value = '';
    ['Str', 'Agi', 'Int', 'Cha', 'Lck', 'Cow', 'Grd'].forEach(trait => {
        document.getElementById(`adv${trait}Min`).value = '';
        document.getElementById(`adv${trait}Max`).value = '';
    });
}


function startGame(isAdvancedGame = false) { // CHANGED: Added parameter
    if (isViewingArchivedGame) return;
    
    if(isAdvancedGame) { // CHANGED: Logic now depends on the button pressed
        setGameAsModified();
    }

    playSound('start');
    currentGameNumber++; 
    isPlayer001VIP = false; 
    player001VIP_Id = null;
    currentPrizePot = 0;
    firstEliminationOfGame = true;
    usedEasterEggIds.clear();

    // Feature Resets
    forcedWinnerId = null; // NEW - Reset the forced winner
    customPlayerPhotos = {}; // NEW - Clear photos on new game
    favoritedPlayerIds.clear(); 
    eliminationOrder = [];
    gameHistorySnapshots = [];
    isViewingHistory = false;
    livePlayersState = null;
    usedEvents.clear();
    updateEventButtons();
    document.getElementById('history-slider-container').style.display = 'none';


    // --- VIP BETTING RESET ---
    isGameModified = isAdvancedGame; // EXPLICITLY set the flag here
    currentBets.forEach(bet => {

        const oldBetPlayer = players.find(p => p.id === bet.playerId);
        if (oldBetPlayer) oldBetPlayer.hasVipBet = false;
    });
    currentBets = [];
    updateVipTab();
    
    unlockAchievement('newGame');

    const numPlayersInput = parseInt(document.getElementById('numPlayers').value);
    if (isNaN(numPlayersInput) || numPlayersInput < 2) { alert("Need at least 2 players."); return; }
    
    if(numPlayersInput >= 456 && !isAdvancedGame) unlockAchievement('fullHouse');
    if(numPlayersInput >= 1000) unlockAchievement('megaGame');

    players = []; round = 0; roundEliminations = []; personalityPlayers.clear(); superpoweredPlayerIds.clear();
    eliminatedHidden = false; votingRoundCount = 0;
    persistentGroupColors = {}; // NEW - Reset for new game
    playerGroupId = {};


    
    document.getElementById('toggleEliminatedBtn').innerText = 'Hide Eliminated/Out';
    const pausePlayBtn = document.getElementById('pausePlayButton');
    pausePlayBtn.innerText = 'Pause Animation'; pausePlayBtn.disabled = true;

    if (animationTimeoutId) clearTimeout(animationTimeoutId); animationTimeoutId = null;
    if (announcementTimeoutId) {
        clearTimeout(announcementTimeoutId); announcementTimeoutId = null;
        document.getElementById('eliminationAnnouncement').style.display = 'none';
    }
    animationPaused = false; playersToEliminateInAnimation = []; animatedEliminationIndex = 0;

    const playersContainer = document.getElementById('players');
    playersContainer.innerHTML = '';
    
    // NEW: Advanced Settings values
    const advFemaleCount = document.getElementById('advFemaleCount').value; // CHANGED
    const advMaleCount = document.getElementById('advMaleCount').value;
    const advCountry = document.getElementById('advCountry').value.trim();
    const advAgeMin = document.getElementById('advAgeMin').value;
    const advAgeMax = document.getElementById('advAgeMax').value;

    // NEW: Overhauled gender calculation
    let numFemales = 0;
    let numMales = 0;

    if (advFemaleCount !== '' && !isNaN(advFemaleCount) || advMaleCount !== '' && !isNaN(advMaleCount)) {
        numFemales = (advFemaleCount !== '' && !isNaN(advFemaleCount)) ? parseInt(advFemaleCount) : 0;
        numMales = (advMaleCount !== '' && !isNaN(advMaleCount)) ? parseInt(advMaleCount) : 0;
        const totalSpecified = numFemales + numMales;

        if (totalSpecified > numPlayersInput) {
            const ratio = numPlayersInput / totalSpecified;
            numFemales = Math.floor(numFemales * ratio);
            numMales = numPlayersInput - numFemales; 
        } else if (totalSpecified < numPlayersInput) {
            const remaining = numPlayersInput - totalSpecified;
            numMales += Math.ceil(remaining / 2);
            numFemales = numPlayersInput - numMales;
        }
    } else {
        const maxFemales = Math.floor(numPlayersInput / 2);
        numFemales = Math.floor(Math.random() * (maxFemales + 1));
        numMales = numPlayersInput - numFemales;
    }


    const genderPool = Array(numFemales).fill('Female').concat(Array(numMales).fill('Male'));
    for (let i = genderPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [genderPool[i], genderPool[j]] = [genderPool[j], genderPool[i]];
    }
    
    const getRandomInRange = (advMin, advMax, defaultMin, defaultMax) => {
        const min = advMin !== '' && !isNaN(advMin) ? parseInt(advMin) : defaultMin;
        const max = advMax !== '' && !isNaN(advMax) ? parseInt(advMax) : defaultMax;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    for (let i = 1; i <= numPlayersInput; i++) {
        const gender = genderPool.pop() || (Math.random() < 0.5 ? 'Male' : 'Female');
        const firstName = gender === "Male" ? firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)] : firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        let newPlayer = {
            id: i, eliminated: false, eliminationRound: null, 
            votedOut: false, roundVotedOut: null, 
            wasFinalistWhenEliminated: false, isWinner: false, isFinalist: false, confirmedFinalist: false,
            isEasterEgg: false,
            isPreviousWinner: false, 
            isFavorite: false, 
            age: getRandomInRange(advAgeMin, advAgeMax, 18, 80),
            country: advCountry || countries[Math.floor(Math.random() * countries.length)],
            occupation: getWeightedRandom(occupations, occupations.map(occ => (occ === "Unemployed" ? 10 : 1))), 
            gender: gender, debt: getDebt(),
            protection: 0, 
            hasHint: false, 
            firstName: firstName, lastName: lastName, name: `${firstName} ${lastName}`, nickname: null,
            relation: null,
            baseStats: {
                strength: getRandomInRange(document.getElementById('advStrMin').value, document.getElementById('advStrMax').value, 1, 10),
                agility: getRandomInRange(document.getElementById('advAgiMin').value, document.getElementById('advAgiMax').value, 1, 10),
                intelligence: getRandomInRange(document.getElementById('advIntMin').value, document.getElementById('advIntMax').value, 1, 10),
                charisma: getRandomInRange(document.getElementById('advChaMin').value, document.getElementById('advChaMax').value, 1, 10),
                luck: getRandomInRange(document.getElementById('advLckMin').value, document.getElementById('advLckMax').value, 1, 10),
                cowardice: getRandomInRange(document.getElementById('advCowMin').value, document.getElementById('advCowMax').value, 1, 10),
                greed: getRandomInRange(document.getElementById('advGrdMin').value, document.getElementById('advGrdMax').value, 1, 10)
            },
            allianceBoost: { strength: 0, agility: 0, intelligence: 0, charisma: 0, luck: 0 },
            voteHistory: [], currentVote: null, allies: [], enemies: [], 
            injury: null,
            actionLog: [],
            hasVipBet: false, 
            reachedTop10: false,
            eliminationsByPlayer: 0,
            highestAllyCount: 0,
            isPregnant: false,
            hasBaby: null,
            isBaby: false,
            hasCaretaker: null,
            caretakerFor: null
        };

        if (easterEggPlayersData[i] && !usedEasterEggIds.has(i) && Math.random() < 0.05 && !isAdvancedGame) {
            let eggData;
            if (typeof easterEggPlayersData[i].resolve === 'function') {
                eggData = easterEggPlayersData[i].resolve();
            } else {
                eggData = easterEggPlayersData[i];
            }

            if (eggData.photoUrl) {
                customPlayerPhotos[i] = eggData.photoUrl;
            }

            newPlayer.name = eggData.name;
            newPlayer.baseStats = { ...eggData.stats };

            if (eggData.personality) {
                Object.assign(newPlayer, eggData.personality);
                if(eggData.personality.name) newPlayer.name = eggData.personality.name;
                if(eggData.personality.firstName && eggData.personality.lastName) newPlayer.name = `${eggData.personality.firstName} ${eggData.personality.lastName}`;
            }

            newPlayer.protection = 1;
            newPlayer.isEasterEgg = true;
            usedEasterEggIds.add(i);

            logEvent(`A special character has appeared! P${formatPlayerNumber(i)} is ${newPlayer.name}.`);
            unlockAchievement('specialCharacter');
        }
        players.push(newPlayer);
    }
    
    originalRosterSize = numPlayersInput; 
    isCompactedView = false;
    
    if (Math.random() < 1/13 && !isAdvancedGame) {
        const potentialMothers = players.filter(p => p.gender === 'Female' && p.age >= 18 && p.age <= 40 && !p.isEasterEgg && !p.isPreviousWinner);
        if (potentialMothers.length > 0) {
            const pregnantPlayer = potentialMothers[Math.floor(Math.random() * potentialMothers.length)];
            pregnantPlayer.isPregnant = true;
            pregnantPlayer.protection += 1;
            superpoweredPlayerIds.add(pregnantPlayer.id);
            logEvent(`${createPlayerLink(pregnantPlayer.id)} (${pregnantPlayer.name}) has entered the games while pregnant.`);
        }
    }

    const loneWinners = allGamesHistory.filter(g => g.winnerId !== null);
    if (loneWinners.length > 0 && Math.random() < 0.05 && !isAdvancedGame) {
        const randomWinnerRecord = loneWinners[Math.floor(Math.random() * loneWinners.length)];
        const winnerData = randomWinnerRecord.fullState.players.find(p => p.id === randomWinnerRecord.winnerId);
        
        if (winnerData) {
            let replacedIndex = players.findIndex(p => p.id === winnerData.id);
            let originalId = winnerData.id;

            if (replacedIndex === -1) {
                const nonSpecialPlayers = players.filter(p => !p.isEasterEgg && !p.isPreviousWinner && p.id > 10);
                if (nonSpecialPlayers.length > 0) {
                    const playerToReplace = nonSpecialPlayers[Math.floor(Math.random() * nonSpecialPlayers.length)];
                    originalId = playerToReplace.id;
                    replacedIndex = players.findIndex(p => p.id === originalId);
                }
            }
            
            if (replacedIndex !== -1) {
                players[replacedIndex] = JSON.parse(JSON.stringify(winnerData));
                
                const returningWinner = players[replacedIndex];
                returningWinner.id = originalId;
                returningWinner.eliminated = false;
                returningWinner.votedOut = false;
                returningWinner.isWinner = false;
                returningWinner.isFinalist = false;
                returningWinner.protection = 3;
                returningWinner.isPreviousWinner = true;
                
                Object.keys(returningWinner.baseStats).forEach(stat => {
                    if(stat !== 'cowardice') returningWinner.baseStats[stat] = Math.min(15, (returningWinner.baseStats[stat] || 0) + 1);
                });
                returningWinner.baseStats.cowardice = Math.max(0, Math.floor(returningWinner.baseStats.cowardice / 2));
                
                logEvent(`A PREVIOUS WINNER RETURNS! P${formatPlayerNumber(originalId)} is actually ${winnerData.name}, the winner of Game #${randomWinnerRecord.gameNumber}! They are more experienced now.`);
                unlockAchievement('previousWinnerJoins');
            }
        }
    }
    clearAdvancedSettings()
    establishRelations();

    if (numPlayersInput > 0 && Math.random() < 0.05 && !isAdvancedGame) {
        const player001 = players.find(p => p.id === 1);
        if (player001 && !player001.isPreviousWinner) {
            isPlayer001VIP = true;
            player001VIP_Id = 1;
            player001.protection = Math.max(player001.protection, 1);
            player001.debt = 0;
            player001.occupation = "Squid Game VIP";
            if (!superpoweredPlayerIds.has(1)) superpoweredPlayerIds.add(1);
            logEvent(`P${formatPlayerNumber(1)} (${player001.name}) is a SECRET VIP this game!`);
        }
    }
    
    document.getElementById('gameLogList').innerHTML = ''; 
    document.getElementById('personalityPlayers').innerHTML = '';
    resetZoom();
    updateAllPlayerDivs();
    updateSuperpowerList();
    updateAllCustomLists(); 
    updateCounters();
    displayWinnerHistory();
    updateEliminationOrderList();

    takeSnapshot(0, "Game Start");
    updateHistorySliderUI();
    document.getElementById('history-slider-container').style.display = 'block';
    document.getElementById('historySliderLabel').innerText = `Live (${players.length} remaining)`;


    if (isAdvancedGame) {
        clearAdvancedSettings();
    }
}

function permanentlyDeleteOutPlayers() {
if (isViewingArchivedGame) return;
if(isCompactedView) {
    isCompactedView = false;
    document.getElementById('toggleRosterBtn').innerText = "Compact Roster (Delete Out)";
}

setGameAsModified();

const initialCount = players.length;
players = players.filter(p => !p.eliminated && !p.votedOut); 
const deletedCount = initialCount - players.length;

originalRosterSize = players.length;
calculateGridPositions(players);

const remainingIds = new Set(players.map(p => p.id));
personalityPlayers = new Set([...personalityPlayers].filter(id => remainingIds.has(id)));
superpoweredPlayerIds = new Set([...superpoweredPlayerIds].filter(id => remainingIds.has(id) || (isPlayer001VIP && id === player001VIP_Id)));

updateAllPlayerDivs();
updateCounters(); 
updateAllCustomLists(); 
updateSuperpowerList(); 
logEvent(`${deletedCount} eliminated/Voted Out players permanently removed. Roster reorganized.`);
}




function applySuperpower() {
    if (isViewingArchivedGame) return;
    setGameAsModified();
    const playerId = parseInt(document.getElementById('superpowerPlayerId').value);
    const protectionLevel = parseInt(document.getElementById('protectionLevel').value);
    if (isNaN(playerId) || playerId <=0 || isNaN(protectionLevel) || protectionLevel <= 0) { alert("Valid ID & protection > 0."); return; }
    const player = players.find(p => p.id === playerId && !p.eliminated && !p.votedOut);
    if (!player) { alert(`Player P${formatPlayerNumber(playerId)} not active.`); return; }
    
    player.protection += protectionLevel;
    if(!superpoweredPlayerIds.has(playerId)) superpoweredPlayerIds.add(playerId); 
    updateAllPlayerDivs(); updateSuperpowerList();
    logEvent(`Superpower (Prot: +${protectionLevel}) applied to P${formatPlayerNumber(playerId)}. Total: ${player.protection}`);
}

function updateSuperpowerList() {
    const list = document.getElementById('superpoweredPlayers'); list.innerHTML = '';
    superpoweredPlayerIds.forEach(id => {
        const p = players.find(player => player.id === id);
        if (p) { 
            let reason = p.roundVotedOut === 'Escaped' ? 'Escaped' : `VR${p.roundVotedOut || 'N/A'}`;
            let status = p.votedOut ? `Out (${reason})` 
                        : p.eliminated ? `Eliminated (GR${p.eliminationRound || 'N/A'})` 
                        : 'In Game';
            let nameDisplay = p.name ? p.name : `P${formatPlayerNumber(p.id)}`;
            if (isPlayer001VIP && p.id === player001VIP_Id) nameDisplay += " [VIP]";
            list.innerHTML += `<li>${createPlayerLink(p.id)} (${nameDisplay}) - Prot: ${p.protection} - ${status}</li>`;
        }
    });
}

function applyPersonality() {
    if (isViewingArchivedGame) return;
    setGameAsModified();
    const playerId = parseInt(document.getElementById('personalityPlayerId').value);
    if (isNaN(playerId) || playerId <= 0) { alert("Valid Player ID."); return; }
    const player = players.find(p => p.id === playerId && !p.eliminated && !p.votedOut);
    if (!player) { alert(`Player P${formatPlayerNumber(playerId)} not active.`); return; }
    
    const firstName = document.getElementById('playerFirstName').value.trim();
    const lastName = document.getElementById('playerLastName').value.trim();
    const nickname = document.getElementById('playerNickname').value.trim();
    const age = parseInt(document.getElementById('playerAge').value);
    const country = document.getElementById('playerCountry').value.trim();
    const occupation = document.getElementById('playerOccupation').value.trim();
    const gender = document.getElementById('playerGender').value;
    const debt = parseInt(document.getElementById('playerDebt').value);

    if (firstName) player.firstName = firstName;
    if (lastName) player.lastName = lastName;
    if (firstName || lastName) player.name = `${player.firstName || ''} ${player.lastName || ''}`.trim();
    if (nickname) player.nickname = nickname; 
    if (player.nickname && !player.name) player.name = player.nickname; 

    if (!isNaN(age) && age >= 18) player.age = age;
    if (country) player.country = country;
    if(occupation && !(isPlayer001VIP && player.id === player001VIP_Id)) player.occupation = occupation;
    if (gender) player.gender = gender;
    if (!isNaN(debt) && debt >=0 && !(isPlayer001VIP && player.id === player001VIP_Id) ) player.debt = debt;

    personalityPlayers.add(playerId);
    updateAllPlayerDivs();
    updateAllCustomLists(); // <-- MODIFIED to include favorites and personalities
    updateCounters();
    logEvent(`Personality applied to P${formatPlayerNumber(playerId)} (${player.name || ''}).`);
}

function updateAllPersonalityLists() {
    const list = document.getElementById('personalityPlayers'); list.innerHTML = '';
    personalityPlayers.forEach(id => {
        const p = players.find(player => player.id === id);
        if (p) {
            let reason = p.roundVotedOut === 'Escaped' ? 'Escaped' : `VR${p.roundVotedOut || 'N/A'}`;
            let status = p.votedOut ? `Out (${reason})` 
                        : p.eliminated ? `Eliminated (GR${p.eliminationRound || 'N/A'})` 
                        : 'In Game';
            let nameDisplay = p.name ? p.name : `P${formatPlayerNumber(p.id)}`;
            if (isPlayer001VIP && p.id === player001VIP_Id) nameDisplay += " [VIP]";
            list.innerHTML += `<li>${createPlayerLink(p.id)} (${nameDisplay}) - ${status}</li>`;
        }
    });
}

function eliminateRandomPlayer() {
    if (isViewingArchivedGame) return;
    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) {
        alert("No active players to eliminate.");
        return;
    }
    const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    manualElimination(true, randomPlayer.id, 'manualPlayerId_other', 'manualActionReason_other');
}

function manualElimination(isRandom = false, randomPlayerId = null, playerIdInputId = 'manualPlayerId_other', reasonInputId = 'manualActionReason_other') {
    if (isViewingArchivedGame) return false;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return false; }
    
    const tempPlayerId = isRandom ? randomPlayerId : parseInt(document.getElementById(playerIdInputId).value);
    const tempPlayer = players.find(p => p.id === tempPlayerId);
    if (tempPlayer && tempPlayer.isBaby) {
        alert("The baby cannot be manually eliminated. Eliminate the caretaker.");
        return false;
    }

    setGameAsModified();
    const playerId = isRandom ? randomPlayerId : parseInt(document.getElementById(playerIdInputId).value);
    if (isNaN(playerId) || playerId <= 0) {
        if (!isRandom) alert("Please enter a valid Player ID.");
        return false;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) { if (!isRandom) alert(`Player P${formatPlayerNumber(playerId)} not found.`); return false; }
    if (player.eliminated || player.votedOut) { if (!isRandom) alert(`Player P${formatPlayerNumber(playerId)} is already out.`); return false; }

    player.eliminated = true;
    player.wasFinalistWhenEliminated = player.isFinalist;
    player.isFinalist = false; player.isWinner = false;
    player.eliminationRound = round;
    currentPrizePot += 100000;

    const reason = document.getElementById(reasonInputId).value.trim();
    let logMessage, actionLogReason;

    if (isRandom) {
        logMessage = `P${formatPlayerNumber(player.id)} (${player.name || ''}) was randomly eliminated.`;
        actionLogReason = 'Randomly eliminated.';
        if (reason) {
            logMessage += ` Reason given: ${reason}.`;
            actionLogReason += ` (Reason: ${reason})`;
        }
    } else {
        unlockAchievement('handOfGod');
        logMessage = `P${formatPlayerNumber(player.id)} (${player.name || ''}) was manually eliminated.`;
        actionLogReason = reason ? `Manually eliminated for: ${reason}.` : 'Manually eliminated for unspecified reasons.';
        if(reason) logMessage += ` Reason: ${reason}.`;
    }
    
    player.actionLog.push(`GR ${round}: ${actionLogReason}`);
    if(firstEliminationOfGame) {
        logEvent(`<strong>FIRST ELIMINATION:</strong> P${formatPlayerNumber(player.id)} was the first person eliminated in Game #${currentGameNumber}!`);
        firstEliminationOfGame = false;
    }
    logEvent(logMessage);

    updateAllianceStatBoosts();
    updateAllPlayerDivs();
    updateAllCustomLists();
    updateSuperpowerList();
    updateCounters();
    
    eliminationOrder.push({ isHeader: true, round: round, text: `Event: Manual Elimination` });
    handleEliminationProcessing([player], actionLogReason, false, "Manual Elimination", false, false, null, true);

    if (!isRandom) {
        alert(`Player P${formatPlayerNumber(player.id)} has been eliminated.`);
        document.getElementById(playerIdInputId).value = '';
        document.getElementById(reasonInputId).value = '';
    }
    return true;
}

function revivePlayer(playerIdInputId = 'manualPlayerId_other') {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    setGameAsModified();
    const playerId = parseInt(document.getElementById(playerIdInputId).value);
    if (isNaN(playerId) || playerId <= 0) {
        alert("Please enter a valid Player ID to revive.");
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
        alert(`Player P${formatPlayerNumber(playerId)} not found.`);
        return;
    }
    if (!player.eliminated && !player.votedOut) {
        alert(`Player P${formatPlayerNumber(playerId)} is still active and cannot be revived.`);
        return;
    }
    unlockAchievement('necromancer');
    const wasVotedOut = player.votedOut;
    player.eliminated = false; player.votedOut = false;
    player.eliminationRound = null; player.roundVotedOut = null;
    player.wasFinalistWhenEliminated = false; player.isFinalist = false; player.isWinner = false;
    
    eliminationOrder = eliminationOrder.filter(item => !item.playerId || item.playerId !== playerId);


    if (!wasVotedOut) {
            currentPrizePot = Math.max(0, currentPrizePot - 100000);
    }
    
    player.actionLog.push(`GR ${round}: Was revived by the game masters.`);
    logEvent(`PLAYER REVIVED! P${formatPlayerNumber(player.id)} (${player.name || ''}) has returned to the game.`);

    updateAllPlayerDivs();
    updateCounters();
    updateAllCustomLists();
    updateSuperpowerList();
    updateEliminationOrderList();
    document.getElementById(playerIdInputId).value = '';
}

function preRoundUpdate() {
    if (isViewingArchivedGame) return false;
    if(isViewingHistory) { alert("Cannot start a new round while viewing history. Please Return to Live."); return false; }
    round++;
    
        if (round === 1) {
        if (personalityPlayers.size >= 10) {
            unlockAchievement('dramatisPersonae');
        }
    }
    
    players.forEach(p => {
        if (p.isPregnant && Math.random() < 1/3) {
            p.isPregnant = false;
            p.hasBaby = {};
            logEvent(`A baby has been born in the dorms!`);
            p.actionLog.push(`(Gave birth at the start of GR ${round})`);
        }
    });

    

    const activePlayers = getActivePlayers();
    if (activePlayers.length <= 10) {
        activePlayers.forEach(p => {
            if (!p.reachedTop10) {
                p.reachedTop10 = true;
                p.actionLog.push(`(Reached the Top 10)`);
            }
        });
    }
    return true;
}

function checkSurvivalMechanics(player, gameName, isEvent = false) {
    if (forcedWinnerId === player.id) {
        return true; 
    }
    
    if (player.hasHint && !isEvent) { 
        player.hasHint = false;
        logEvent(`${createPlayerLink(player.id)}'s hint allowed them to automatically pass ${gameName}!`);
        player.actionLog.push(`Event: Used a hint to pass ${gameName}.`);
        return true; 
    }
    if (player.protection > 0) {
        player.protection--;
        logEvent(`${createPlayerLink(player.id)}'s protection saved them during ${gameName}! (${player.protection} left)`);
        updateSuperpowerList();
        player.actionLog.push(`Event: Survived ${gameName} due to protection.`);
        return true; 
    }
    return false; 
}


function playRound() {
    if (isViewingArchivedGame) return;
    if (!preRoundUpdate()) return;

    if(animationModeEnabled) {
            toggleAnimationMode();
    }
    const numEliminatedInput = parseInt(document.getElementById('numEliminated').value);
    const description = document.getElementById('roundDescription').value || "failed a generic challenge";
    let activePlayers = getActivePlayers();

    if (activePlayers.length === 0) { alert("No active players!"); return; }
    if (numEliminatedInput <= 0) { alert("Eliminations must be > 0."); return; }
        if (activePlayers.length > 0 && numEliminatedInput >= activePlayers.length ) {
            alert("Too many eliminations for remaining players! At least one must survive."); return;
    }
    
    activePlayers = getActivePlayers();

    const eliminatedThisRound = [];
    let availableForElimination = [...activePlayers];
    let successfullyEliminatedCount = 0;
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Custom Round` });

    while(successfullyEliminatedCount < numEliminatedInput && availableForElimination.length > 0) {
        const selectionIndex = Math.floor(Math.random() * availableForElimination.length);
        const selectedPlayer = availableForElimination[selectionIndex];
        
        if (checkSurvivalMechanics(selectedPlayer, "a custom round")) {
            availableForElimination.splice(selectionIndex, 1);
            continue; 
        }
        
        availableForElimination.splice(selectionIndex, 1);
        eliminatedThisRound.push(selectedPlayer);
        successfullyEliminatedCount++;
    }
    
    if (animationModeEnabled) {
        playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
        animatedEliminationIndex = 0;
        processNextAnimatedElimination(description);
    } else {
            handleEliminationProcessing(eliminatedThisRound, description, false, "a custom round", false, false, null);
    }
}

function toggleAnimationMode() {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) return;
    animationModeEnabled = !animationModeEnabled;
    const btn = document.getElementById('animationModeBtn');
    btn.classList.toggle('active', animationModeEnabled);
    btn.innerText = animationModeEnabled ? 'Animation Mode ARMED' : 'Arm Animation Mode';
}

function processNextAnimatedElimination(reason, isVotedOutAction = false, customRoundVotedOut = null, reasonPool = null) {
    if (isViewingArchivedGame) return;
    if (animationPaused) return;

    const controls = document.querySelectorAll('.controls button, .control-panel button');
    controls.forEach(c => c.disabled = true);
    document.getElementById('pausePlayButton').disabled = false;
    
    const announcement = document.getElementById('eliminationAnnouncement');
    if (announcementTimeoutId) clearTimeout(announcementTimeoutId);

    if (animatedEliminationIndex < playersToEliminateInAnimation.length) {
        const playerId = playersToEliminateInAnimation[animatedEliminationIndex];
        const player = players.find(p => p.id === playerId);
        
        if (isVotedOutAction) {
            player.votedOut = true;
            player.roundVotedOut = customRoundVotedOut || (votingRoundCount > 0 ? votingRoundCount : null);
        } else {
            player.eliminated = true;
            player.eliminationRound = round;
            player.wasFinalistWhenEliminated = player.isFinalist;
            player.isFinalist = false; 
            player.isWinner = false;
        }
        
        playSound('elimination');
        updateAllPlayerDivs();
        updateCounters();

        announcement.innerHTML = `Player ${formatPlayerNumber(player.id)} Eliminated.`;
        announcement.style.display = 'block';
        announcement.classList.remove('fade-out');
        announcementTimeoutId = setTimeout(() => announcement.classList.add('fade-out'), 1300);

        animatedEliminationIndex++;
        const delay = Math.random() * 400 + 100;
        animationTimeoutId = setTimeout(() => processNextAnimatedElimination(reason, isVotedOutAction, customRoundVotedOut, reasonPool), delay);
    } else {
        controls.forEach(c => c.disabled = false);
        document.getElementById('pausePlayButton').disabled = true;
        document.getElementById('pausePlayButton').innerText = 'Pause Animation';

        const eliminatedPlayersObjects = playersToEliminateInAnimation.map(id => players.find(p => p.id === id));
        handleEliminationProcessing(eliminatedPlayersObjects, reason, true, "Animation", isVotedOutAction, false, null, false, reasonPool);
    }
}

function pausePlayAnimation() {
    if (isViewingArchivedGame) return;
    const btn = document.getElementById('pausePlayButton');
    animationPaused = !animationPaused;
    if (animationPaused) {
        btn.innerText = 'Resume Animation';
        if (animationTimeoutId) clearTimeout(animationTimeoutId);
    } else {
        btn.innerText = 'Pause Animation';
        const reason = document.getElementById('roundDescription').value || "failed a generic challenge";
        processNextAnimatedElimination(reason);
    }
}

function startVotingRound() {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    if (!season2ModeActive) { alert("Season 2 Mode is not active."); return; }
    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) { alert("No active players to vote."); return; }
    
    playSound('click');
    votingRoundCount++;
    let oVotes = 0; let xVotes = 0;

    const charismaticO_Voters = activePlayers.filter(p => getEffectiveStat(p, 'charisma') > 7 && (p.currentVote === 'O' || p.voteHistory.length === 0));
    let xVoters = activePlayers.filter(p => p.currentVote === 'X');

    charismaticO_Voters.forEach(influencer => {
        if (Math.random() < getEffectiveStat(influencer, 'charisma') / 100) { 
            const target = xVoters[Math.floor(Math.random() * xVoters.length)];
            if (target && target.currentVote === 'X') {
                if(Math.random() < 0.5) { 
                    target.currentVote = 'O'; 
                    logEvent(`P${formatPlayerNumber(influencer.id)} (${influencer.name}) successfully convinced P${formatPlayerNumber(target.id)} to change their vote to O!`);
                }
            }
        }
    });

    activePlayers.forEach(player => {
        let voteDecision;
        if (isPlayer001VIP && player.id === player001VIP_Id) {
            voteDecision = 'O';
        } else if (player.voteHistory.length === 0) { 
            voteDecision = Math.random() < (Math.random() * (0.60 - 0.47) + 0.47) ? 'O' : 'X';
        } else {
            if (player.currentVote === 'O') voteDecision = Math.random() < 0.90 ? 'O' : 'X'; 
            else voteDecision = Math.random() < 0.90 ? 'X' : 'O'; 
        }
        player.currentVote = voteDecision;
        player.voteHistory.push({ votingRound: votingRoundCount, gameRoundAtVote: round, vote: voteDecision });
        if (voteDecision === 'O') oVotes++; else xVotes++;
    });

    updateAllPlayerDivs(); updateStatistics();

    let logMessage = `Voting Round ${votingRoundCount} (during GR ${round}):<br>`;
    logMessage += `  Players Voted 'O' (Stay): ${oVotes}<br>`;
    logMessage += `  Players Voted 'X' (Leave): ${xVotes}<br>`;
    if (xVotes > oVotes) {
        const moneyPerPlayer = activePlayers.length > 0 ? TOTAL_PRIZE_MONEY / activePlayers.length : 0;
        const popupMessage = `Majority voted to LEAVE!\n${formatCurrency(TOTAL_PRIZE_MONEY)} split among ${activePlayers.length} active player(s).\nEach receives: ${formatCurrency(moneyPerPlayer)}.`;
        alert(popupMessage);
        logMessage += `  Result: Majority voted to LEAVE.`;
        if (confirm("A majority has voted to end the game. Do the remaining players agree to leave? (OK=Yes, Cancel=No)")) {
                logEvent(logMessage + " The players agreed to leave.");
                playPresetGame('Voted To Leave', 100, 100, "agreed to leave after the vote");
        } else {
                logEvent(logMessage + " But they were forced to continue!");
        }
    } else {
        logMessage += `  Result: Majority (${oVotes > xVotes ? 'O' : 'Tie, O default'}) voted to STAY. Game continues.`;
        logEvent(logMessage);
    }
}

function playPresetGame(gameName, minPercent, maxPercent, gameDescription, reasonPool = null) {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    const eventNames = ["Confirm Winners", "Voted To Leave", "Get Finalist", "Confirm Finalists"];
    const isGameRound = !eventNames.includes(gameName);
    let activePlayers = getActivePlayers();

    if (gameName === "Confirm Winners") {
        if (activePlayers.length > 0) {
            logEvent(`Event (Post-GR ${round}): All ${activePlayers.length} remaining players have been confirmed as JOINT WINNERS!`);
            activePlayers.forEach(p => { p.isWinner = true; p.isFinalist = false; });
            checkFinalistsAndWinner();
        } else {
            logEvent(`Event (Post-GR ${round}): No players to confirm as winners.`);
        }
        return;
    }

    if (gameName === "Confirm Finalists") {
        logEvent(`Event (Post-GR ${round}): All ${activePlayers.length} remaining players are confirmed as FINALISTS.`);
        activePlayers.forEach(p => { p.isFinalist = true; p.confirmedFinalist = true; });
        updateAllPlayerDivs();
        updateCounters();
        return;
    }

    if (isGameRound) {
        if (!preRoundUpdate()) return;
    }
    
    const rebellionDeathReasons = ['Died while getting flanked', 'Got shot by guard', 'Died while shot on the stairs', 'Died in the control room'];
    if (gameName === "Rebellion") {
        reasonPool = rebellionDeathReasons;
    }

    activePlayers = getActivePlayers();

    if (gameName === "Get Finalist" && activePlayers.length <= 3) { 
        logEvent(`Event (Post-GR ${round}): Target (<=3) for Get Finalist already met.`); 
        return; 
    }
    if (activePlayers.length === 0) {
        const roundType = isGameRound ? `GR ${round}` : `Event (Post-GR ${round})`;
        logEvent(`${roundType} (${gameName}): No active players.`);
        return;
    }

    eliminationOrder.push({ isHeader: true, round: round, text: `${isGameRound ? `GR ${round}` : 'Event'}: ${gameName}` });

    let isVotedOutAction = gameName === "Voted To Leave";
    let isRebellion = gameName === "Rebellion";
    let availablePlayersToPickFrom = [...activePlayers];
    let rebellionFallback = false;
    
    if (isRebellion) {
        const xVoters = activePlayers.filter(p => p.currentVote === 'X');
        if (!season2ModeActive || xVoters.length === 0) {
                rebellionFallback = true;
                minPercent = 10; maxPercent = 10;
        } else {
            availablePlayersToPickFrom = xVoters;
            minPercent = 30; maxPercent = 30;
        }
    } else if (isVotedOutAction) {
        availablePlayersToPickFrom.sort((a,b) => (getEffectiveStat(b, 'cowardice') - getEffectiveStat(b, 'greed')) - (getEffectiveStat(a, 'cowardice') - getEffectiveStat(a, 'greed')));
    }
    
    let numToEliminateTarget;
    
    if (gameName === "Get Finalist") {
            numToEliminateTarget = availablePlayersToPickFrom.length > 3 ? availablePlayersToPickFrom.length - 3 : 0;
    } else {
        const randomPercent = Math.random() * (maxPercent - minPercent) + minPercent;
        numToEliminateTarget = Math.floor(availablePlayersToPickFrom.length * (randomPercent / 100));
    }
    
    const eliminatedThisRound = [];
    let successfullyEliminatedCount = 0;
    
    if (isRebellion && !rebellionFallback && Math.random() < 0.10) {
        const rebelLeader = availablePlayersToPickFrom.sort((a,b) => (getEffectiveStat(b,'charisma') + getEffectiveStat(b,'strength')) - (getEffectiveStat(a,'charisma') + getEffectiveStat(a,'strength')))[0];
        const rebels = availablePlayersToPickFrom.map(p => `P${formatPlayerNumber(p.id)}`).join(', ');
        let survivors = getActivePlayers();
        
        let casualties = [];
        const numCasualties = Math.floor(Math.random() * 11); // 0-10 casualties
        survivors.sort(() => 0.5 - Math.random());
        for(let i=0; i<numCasualties && survivors.length > 1; i++) {
            casualties.push(survivors.pop());
        }

        logEvent(`<strong>REBELLION SUCCESSFUL!</strong> The players have overthrown the game!`, `Rebels: ${rebels}.`);
        logEvent(`P${formatPlayerNumber(rebelLeader.id)} took down the Front Man! Most survivors escape, but ${casualties.length} died in the fighting.`);
        unlockAchievement('revolution');

        casualties.forEach(p => {
            p.eliminated = true;
            const deathReason = rebellionDeathReasons[Math.floor(Math.random() * rebellionDeathReasons.length)];
            p.actionLog.push(`Event: ${deathReason} during the successful rebellion.`);
        });
        
        saveCompletedGameRecord({
            winnerId: null, winnerName: "Rebellion Successful",
            finalistIds: survivors.map(p => p.id),
            specialOutcome: `All ${survivors.length} players escaped after a successful rebellion led by ${createPlayerLink(rebelLeader.id)}.`,
            prizeSplit: 0
        });
        displayWinnerHistory();
        players.forEach(p=> { if (!p.eliminated) p.eliminated = true; }); 
        updateAllPlayerDivs(); updateCounters();
        return;
    }

    while (successfullyEliminatedCount < numToEliminateTarget && availablePlayersToPickFrom.length > 0) {
        const selectionIndex = isVotedOutAction ? 0 : Math.floor(Math.random() * availablePlayersToPickFrom.length);
        let selectedPlayer = availablePlayersToPickFrom[selectionIndex];
        
        let wasSabotagedByEnemy = false;
        let enemyFactor = 0;
        if (selectedPlayer.caretakerFor) {
                if (Math.random() > 0.8) wasSabotagedByEnemy = false;
        } else if (selectedPlayer.enemies && selectedPlayer.enemies.length > 0) {
                const activeEnemies = selectedPlayer.enemies.filter(enemyId => players.some(p => p.id === enemyId && !p.eliminated && !p.votedOut));
                if (activeEnemies.length > 0 && ['Jump Rope'].includes(gameName)) {
                const enemy = players.find(p => p.id === activeEnemies[0]);
                enemyFactor = 0.25;
                if (enemy.caretakerFor && enemy.enemies.includes(selectedPlayer.id)) {
                    enemyFactor = 0.9;
                }
                if(Math.random() < enemyFactor){
                    wasSabotagedByEnemy = true;
                    creditElimination(enemy.id, selectedPlayer.id);
                    selectedPlayer.actionLog.push(`GR ${round}: Was sabotaged by enemy P${formatPlayerNumber(enemy.id)} during ${gameName}.`);
                    enemy.actionLog.push(`GR ${round}: Sabotaged enemy P${formatPlayerNumber(selectedPlayer.id)} during ${gameName}.`);
                }
            }
        }


        if(wasSabotagedByEnemy) { 
        } else {
            if (!isVotedOutAction) {
                let survivalModifier = 0;
                const traitGames = ['Mingle', 'Jump Rope', 'Human Chess', 'Four Square', 'Lights Out', 'Simon Says', 'Musical Chairs'];
                if(traitGames.includes(gameName)) {
                    if(gameName === 'Mingle') survivalModifier = (getEffectiveStat(selectedPlayer, 'charisma') + getEffectiveStat(selectedPlayer, 'luck') - getEffectiveStat(selectedPlayer, 'cowardice')) / 50;
                    if(gameName === 'Jump Rope') survivalModifier = getEffectiveStat(selectedPlayer, 'agility') / 40;
                    if(gameName === 'Human Chess') survivalModifier = (getEffectiveStat(selectedPlayer, 'intelligence') * 1.5 + getEffectiveStat(selectedPlayer, 'luck')) / 70;
                    if(gameName === 'Four Square') survivalModifier = getEffectiveStat(selectedPlayer, 'agility') / 35;
                    if (gameName === 'Lights Out') survivalModifier = (getEffectiveStat(selectedPlayer, 'strength') + getEffectiveStat(selectedPlayer, 'luck') - getEffectiveStat(selectedPlayer, 'cowardice')) / 25;
                    if (gameName === 'Simon Says') survivalModifier = getEffectiveStat(selectedPlayer, 'intelligence') / 20;
                    if (gameName === 'Musical Chairs') survivalModifier = getEffectiveStat(selectedPlayer, 'luck') / 25;
                } else if (selectedPlayer.allies && selectedPlayer.allies.length > 0) {
                        survivalModifier = 0.05;
                }
                
                if (Math.random() < survivalModifier) {
                    availablePlayersToPickFrom.splice(selectionIndex, 1);
                    continue; 
                }
            }
            
            if (!isVotedOutAction && checkSurvivalMechanics(selectedPlayer, gameName)) {
                availablePlayersToPickFrom.splice(selectionIndex, 1);
                continue;
            }
        }

        availablePlayersToPickFrom.splice(selectionIndex, 1);
        
        if (gameName === 'Mingle') {
            const mingleRounds = ['first', 'second', 'third', 'fourth', 'fifth'];
            const failedRound = mingleRounds[Math.floor(Math.random() * mingleRounds.length)];
            selectedPlayer.actionLog.push(`GR ${round}: Eliminated on the ${failedRound} round of Mingle.`);
        }
        eliminatedThisRound.push(selectedPlayer); successfullyEliminatedCount++;
    }
    

    if (rebellionFallback) {
            logEvent(`GR ${round} (Rebellion): No X-voters, ${eliminatedThisRound.length} random player(s) eliminated.`);
    }
    
    const survivorsThisRound = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));
    survivorsThisRound.forEach(s => s.actionLog.push(`GR ${round}: Passed ${gameName}.`));
    if (gameName === 'Voted To Leave') {
        eliminatedThisRound.forEach(e => e.actionLog.push(`GR ${round}: Player left the games, but didn't return.`));
    } else if (reasonPool) {
            eliminatedThisRound.forEach(e => {
            const reason = reasonPool[Math.floor(Math.random() * reasonPool.length)];
            e.actionLog.push(`GR ${round}: ${reason} during the rebellion.`);
            });
    }
    else {
        eliminatedThisRound.forEach(e => e.actionLog.push(`GR ${round}: Failed ${gameName}.`));
    }
    
    eliminatedThisRound.sort(() => Math.random() - 0.5);

    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            let reason = rebellionFallback ? `were randomly eliminated as there were no rebels.` : gameDescription;
            processNextAnimatedElimination(reason, isVotedOutAction, null, reasonPool);
    } else {
        handleEliminationProcessing(eliminatedThisRound, gameDescription, false, gameName, isVotedOutAction, rebellionFallback, null, false, reasonPool);
    }
}

function handleEliminationProcessing(eliminatedThisRound, reason, wasAnimated = false, gameName = "a custom round", isVotedOutAction = false, rebellionFallback = false, customDetails = null, isManualAction = false, reasonPool = null) {
    let actualEliminations = [];
    let babyTransformations = new Map(); 
    
    eliminatedThisRound.forEach(p => {
        if (p.hasBaby && !p.isBaby) {
            p.eliminated = false;
            
            p.name = "Unnamed Baby";
            p.isBaby = true;
            p.age = 0;
            p.occupation = "Infant";
            p.debt = 0;
            p.gender = Math.random() < 0.5 ? 'Male' : 'Female';
            p.baseStats = { strength: 1, agility: 1, intelligence: 1, charisma: 1, luck: 1, cowardice: 1, greed: 1 };
            
            babyTransformations.set(p.id, p);
            logEvent(`The eliminated P${formatPlayerNumber(p.id)}'s baby has taken their place in the game!`);
        } else if (p.caretakerFor) {
            const baby = players.find(b => b.id === p.caretakerFor);
            if (baby && !actualEliminations.includes(baby)) {
                logEvent(`The caretaker P${formatPlayerNumber(p.id)} has died. The baby they were protecting, P${formatPlayerNumber(baby.id)}, has also been eliminated.`);
                actualEliminations.push(baby);
            }
            actualEliminations.push(p);
        }
        else {
            actualEliminations.push(p);
        }
    });

    if (!wasAnimated) {
        actualEliminations.forEach(p => {
            if (isVotedOutAction) {
                p.votedOut = true;
                p.roundVotedOut = votingRoundCount > 0 ? votingRoundCount : null; 
            } else {
                p.eliminated = true;
                p.eliminationRound = round;
                p.wasFinalistWhenEliminated = p.isFinalist;
                p.isFinalist = false; 
                p.isWinner = false;
            }
            playSound('elimination');
        });
        updateAllPlayerDivs();
    }

    actualEliminations.forEach(p => {
        const isEvent = gameName.includes("Event") || isManualAction || usedEvents.has(gameName.toLowerCase().replace(/ /g, ''));
        if (!eliminationOrder.some(item => !item.isHeader && item.playerId === p.id)) {
            eliminationOrder.push({ isHeader: false, playerId: p.id, fromEvent: isEvent });
        }
            if (reasonPool && !isVotedOutAction) {
            const deathReason = reasonPool[Math.floor(Math.random() * reasonPool.length)];
            p.actionLog.push(`GR ${round}: ${deathReason}`);
        }
    });
    updateEliminationOrderList();

    const betsToRemove = [];
    for (const bet of currentBets) {
        const eliminatedBetPlayer = actualEliminations.find(p => p.id === bet.playerId);
        if (eliminatedBetPlayer) {
            if (eliminatedBetPlayer.reachedTop10) {
                const payout = Math.floor(bet.potentialPayout / 3);
                bettingBalance += bet.amount + payout;
                logEvent(`<b>VIP BET:</b> Your pick, P${formatPlayerNumber(bet.playerId)}, was eliminated but finished in the Top 10! You win ${formatCurrency(payout)}.`, `Wager of ${formatCurrency(bet.amount)} returned. New Balance: ${formatCurrency(bettingBalance)}`);
                unlockAchievement('topTenBet');
            } else {
                const loss = Math.floor(bet.amount / 2);
                bettingBalance += (bet.amount - loss);
                logEvent(`<b>VIP BET:</b> Your pick, P${formatPlayerNumber(bet.playerId)}, has been eliminated. You lose ${formatCurrency(loss)}.`,  `New Balance: ${formatCurrency(bettingBalance)}`);
            }
            eliminatedBetPlayer.hasVipBet = false;
            betsToRemove.push(bet.playerId);
        }
    }
    currentBets = currentBets.filter(bet => !betsToRemove.includes(bet.playerId));
    updateVipTab();
    
    let logText;
    if (rebellionFallback) {
        logText = `GR ${round} (Rebellion): No X-voters, ${actualEliminations.length} random player(s) eliminated.`;
    } else {
        let actionVerb = isVotedOutAction ? "Voted Out" : "Eliminated";
        const isEvent = gameName.includes("Event") || isManualAction || usedEvents.has(gameName.toLowerCase().replace(/ /g, ''));
        const roundPrefix = isEvent ? `Event (Post-GR ${round})` : `GR ${round}`;
        logText = `${roundPrefix} (${gameName}): ${actualEliminations.length} player(s) ${actionVerb}.`;
    }

    if (firstEliminationOfGame && actualEliminations.length > 0) {
        logEvent(`<strong>FIRST ELIMINATION:</strong> P${formatPlayerNumber(actualEliminations[0].id)} was the first person eliminated in Game #${currentGameNumber}!`);
        firstEliminationOfGame = false;
    }

    if (actualEliminations.length > 0) {
        if (!isVotedOutAction) {
            currentPrizePot += actualEliminations.length * 100000;
        }
        let details;
        if (customDetails) {
            details = customDetails;
        } else {
            let processedNames = actualEliminations.map(p => `P${formatPlayerNumber(p.id)} (${p.name || ''})`).join(', ');
            details = `Details:<br>${isVotedOutAction ? "Voted Out" : "Eliminated"}: ${processedNames}`;
        }

        logEvent(logText, details);
    } else if (!wasAnimated && !isManualAction && babyTransformations.size === 0) {
            const isEvent = gameName.includes("Event") || isManualAction || usedEvents.has(gameName.toLowerCase().replace(/ /g, ''));
            const roundPrefix = isEvent ? `GR ${round}` : `GR ${round}`;
            logEvent(`${roundPrefix} (${gameName}): None were eliminated or the target was 0.`);
    }
    
    if (babyTransformations.size > 0) {
        babyTransformations.forEach(baby => {
            let activePlayersForCaretaker = getActivePlayers().filter(p => !p.caretakerFor);
            if (activePlayersForCaretaker.length > 0) {
                activePlayersForCaretaker.sort((a,b) => (b.baseStats.charisma - b.baseStats.greed) - (a.baseStats.charisma - a.baseStats.greed));
                const caretaker = activePlayersForCaretaker[0];
                
                caretaker.caretakerFor = baby.id;
                baby.hasCaretaker = caretaker.id;
                caretaker.protection = Math.max(1, caretaker.protection);
                logEvent(`${createPlayerLink(caretaker.id)} has taken the baby under their care. They are now highlighted pink.`);
                caretaker.actionLog.push(`(Became the caretaker for P${formatPlayerNumber(baby.id)})`);

                const greedyPlayers = getActivePlayers().filter(p => p.baseStats.greed >= 10 && p.id !== caretaker.id);
                if (greedyPlayers.length > 0) {
                        logEvent("The greediest players have become hostile towards the new caretaker!");
                        greedyPlayers.forEach(gp => {
                            if (!caretaker.enemies.includes(gp.id)) caretaker.enemies.push(gp.id);
                            if (!gp.enemies.includes(caretaker.id)) gp.enemies.push(caretaker.id);
                            gp.baseStats.greed = Math.min(15, gp.baseStats.greed + 5);
                        });
                }
            } else {
                baby.eliminated = true;
                logEvent(`No one was willing to care for the new baby. P${formatPlayerNumber(baby.id)} has been eliminated.`);
            }
        });
    }


    if (!isManualAction) {
        checkRelationGrief(actualEliminations);
        checkAllianceWipe(actualEliminations);
        updateRelationships();
        checkForNewInjuries(gameName);
        updateInjuryTimers();
        if (Math.random() < 0.01) frontManIntervention();
    }
    
    if(!wasAnimated) updateAllPlayerDivs();
    
    updateCounters();
    updateFavoritedPlayersList();
    
    if (isVotedOutAction) {
            const activePlayers = getActivePlayers();
            if(activePlayers.length === 0) {
            if (currentBets.length > 0) {
                logEvent(`<b>VIP BETTING:</b> The game ended by vote. All active bets are refunded.`);
                currentBets.forEach(bet => {
                    bettingBalance += bet.amount;
                    logEvent(`<b>VIP BET REFUND:</b> P${formatPlayerNumber(bet.playerId)} - Bet of ${formatCurrency(bet.amount)} refunded.`);
                });
                currentBets = [];
                updateVipTab();
            }

            const prizeSplit = actualEliminations.length > 0 ? (currentPrizePot > 0 ? currentPrizePot : TOTAL_PRIZE_MONEY) / actualEliminations.length : 0;
            
            saveCompletedGameRecord({
                winnerId: null, winnerName: "Game Ended by Vote",
                finalistIds: actualEliminations.map(p => p.id),
                specialOutcome: `All ${actualEliminations.length} remaining players voted to leave.`, 
                prizeSplit: prizeSplit
            });
            displayWinnerHistory();
            return;
            }
    }
    
    checkFinalistsAndWinner();

    const isEvent = gameName.includes("Event") || isManualAction || usedEvents.has(gameName.toLowerCase().replace(/ /g, ''));
    const roundNumForSnap = isEvent ? round + 0.5 : round;
    takeSnapshot(roundNumForSnap, gameName);
    updateHistorySliderUI();
}

function checkAllianceWipe(eliminatedThisRound) {
    if (eliminatedThisRound.length === 0) return;

    const eliminatedIds = new Set(eliminatedThisRound.map(p => p.id));
    const survivors = getActivePlayers();
    let selfEliminators = [];

    survivors.forEach(survivor => {
        if (!survivor.allies || survivor.allies.length < 3) return;

        const alliesBeforeElimination = survivor.allies;
        const eliminatedAllies = alliesBeforeElimination.filter(allyId => eliminatedIds.has(allyId));
        
        if (eliminatedAllies.length === alliesBeforeElimination.length) {
            if (Math.random() < 0.25) {
                if(!selfEliminators.find(p => p.id === survivor.id)) {
                    selfEliminators.push(survivor);
                }
            }
        }
    });

    if (selfEliminators.length > 0) {
        unlockAchievement('tragedy');
        eliminationOrder.push({ isHeader: true, round: round, text: `Event: Alliance Wipe` });
        selfEliminators.forEach(p => {
            const reason = `Self-eliminated out of grief after their entire alliance was wiped out.`;
            p.actionLog.push(`Event: ${reason}`);
            logEvent(`A TRAGEDY! P${formatPlayerNumber(p.id)} has self-eliminated out of grief!`, `P${formatPlayerNumber(p.id)}'s allies (${p.allies.map(id => `P${formatPlayerNumber(id)}`).join(', ')}) were all eliminated this round.`);
        });
        handleEliminationProcessing(selfEliminators, "self-eliminated out of grief", false, "Self-Elimination (Alliance)", false, false);
    }
}

function checkRelationGrief(eliminatedThisRound) {
    if (eliminatedThisRound.length === 0) return;
    
    let selfEliminators = [];
    const checkedPartners = new Set();

    eliminatedThisRound.forEach(eliminatedPlayer => {
        if (!eliminatedPlayer.relation) return;

        const partner = players.find(p => p.id === eliminatedPlayer.relation.targetId && !p.eliminated && !p.votedOut);
        
        if (partner && !checkedPartners.has(partner.id)) {
            checkedPartners.add(partner.id);
            if (Math.random() < 0.20) {
                    if(!selfEliminators.find(p => p.id === partner.id)) {
                    selfEliminators.push(partner);
                }
            }
        }
    });

    if (selfEliminators.length > 0) {
        unlockAchievement('tragedy');
        eliminationOrder.push({ isHeader: true, round: round, text: `Event: Grief Eliminations` });
        selfEliminators.forEach(p => {
            const reason = `Self-eliminated out of grief for their relation, ${createPlayerLink(p.relation.targetId)}.`;
            p.actionLog.push(`Event: ${reason}`);
            logEvent(`A TRAGEDY! ${createPlayerLink(p.id)} has self-eliminated out of grief!`, reason);
        });
        handleEliminationProcessing(selfEliminators, "self-eliminated out of grief", false, "Self-Elimination (Grief)", false, false);
    }
}


function checkFinalistsAndWinner() {
    if(isViewingHistory) return;
    const activePlayers = getActivePlayers();
    const playerCount = activePlayers.length;
    
    if (playerCount === 1) { 
        const realPlayer = activePlayers[0];
        const baby = players.find(p => p.isBaby && !p.eliminated && !p.votedOut);
        
        if (baby && realPlayer.caretakerFor === baby.id) {
            const caretaker = realPlayer;
            playSound('win');
            logEvent(`A final act of love! The caretaker ${createPlayerLink(caretaker.id)} sacrifices themself to let the baby ${createPlayerLink(baby.id)} win!`);

            caretaker.eliminated = true;
            caretaker.eliminationRound = round;
            caretaker.wasFinalistWhenEliminated = true;
            caretaker.isFinalist = false;
            caretaker.isWinner = false;
            caretaker.actionLog.push(`GR ${round}: Sacrificed themself so the baby could win.`);

            baby.isWinner = true;
            baby.actionLog.push(`GR ${round}: Won the Squid Game after their caretaker sacrificed themself.`);

            eliminationOrder.push({ isHeader: true, round: round, text: `Event: Final Sacrifice` });
            eliminationOrder.push({ isHeader: false, playerId: caretaker.id, fromEvent: true });
            updateEliminationOrderList();

            saveCompletedGameRecord({
                winnerId: baby.id,
                winnerName: baby.name,
                finalistIds: [caretaker.id]
            });

            displayWinnerHistory();
            updateAllPlayerDivs();
            updateCounters();

            return;
        }
    }

    const jointWinners = activePlayers.filter(p => p.isWinner);
    if (jointWinners.length > 1) {
        playSound('win');
        const winnerIds = jointWinners.map(w => w.id);
        const prizeSplit = currentPrizePot / jointWinners.length;
        logEvent(`The game has concluded with ${jointWinners.length} JOINT WINNERS!`);
        unlockAchievement('sharedVictory');
        
        if (currentBets.length > 0) {
            logEvent(`<b>VIP BETTING:</b> The game ended with joint winners. All active bets are refunded.`);
            currentBets.forEach(bet => {
                bettingBalance += bet.amount;
                logEvent(`<b>VIP BET REFUND:</b> Bet on P${formatPlayerNumber(bet.playerId)} for ${formatCurrency(bet.amount)} refunded.`);
            });
            currentBets = [];
            updateVipTab();
        }
        
        saveCompletedGameRecord({
            winnerId: null, winnerName: "Joint Winners",
            finalistIds: winnerIds,
            specialOutcome: `${jointWinners.length} players agreed to split the prize money.`, prizeSplit: prizeSplit
        });
        
        displayWinnerHistory(); updateAllPlayerDivs();
        return; 
    }

    players.forEach(p => { 
        if (!p.eliminated && !p.votedOut && !p.isWinner && !p.confirmedFinalist) {
            p.isFinalist = false; 
        }
    });
    
    if (playerCount === 1) {
        playSound('win');
        const winner = activePlayers[0];
        winner.isWinner = true; 
        updateProgressAchievement('serialWinner', 1);

        if (winner.isPreviousWinner) {
            unlockAchievement('previousWinnerWins');
        }

        const winningBet = currentBets.find(bet => bet.playerId === winner.id);
        if (winningBet) {
                bettingBalance += winningBet.amount + winningBet.potentialPayout;
                logEvent(`<b>VIP BET:</b> YOUR PICK WON! P${formatPlayerNumber(winner.id)} is the winner! You receive ${formatCurrency(winningBet.potentialPayout)}.`, `Wager returned. Final Balance: ${formatCurrency(bettingBalance)}`);
                unlockAchievement('firstWinBet');
                if (!isGameModified && winningBet.initialRound <= 3) {
                unlockAchievement('betEarlyWinner');
            }
                currentBets = [];
                updateVipTab();
        }

        if (!isGameModified) {
            if (winner.id < 10) unlockAchievement('underdogWinner');
            if (winner.isEasterEgg) unlockAchievement('canonWinner');
            if (winner.age >= 80) unlockAchievement('goldenYears');
            if (winner.debt >= 2500000) unlockAchievement('debtFree');
        }
        
        const eliminatedFinalists = players.filter(p => p.wasFinalistWhenEliminated && p.id !== winner.id);
        const finalistIds = eliminatedFinalists.map(p => p.id);

        logEvent(`P${formatPlayerNumber(winner.id)} (${winner.name || ''}) IS THE WINNER OF SQUID GAME (Game #${currentGameNumber})!`);
        
        saveCompletedGameRecord({
            winnerId: winner.id,
            winnerName: winner.name || `P${formatPlayerNumber(winner.id)}`,
            finalistIds: finalistIds
        });

        displayWinnerHistory();

    } else if (playerCount > 1 && playerCount <= 3) {
        logEvent(`Players ${activePlayers.map(p => `P${formatPlayerNumber(p.id)} (${p.name || ''})`).join(', ')} are FINALISTS (Game #${currentGameNumber}).`);
        activePlayers.forEach(player => { if (!player.confirmedFinalist) player.isFinalist = true; });
    } else if (playerCount === 0 && players.length > 0) { 
        const lastPlayerOut = players.find(p => p.eliminationRound === round || p.roundVotedOut > 0 );
        if (lastPlayerOut && lastPlayerOut.votedOut && lastPlayerOut.roundVotedOut !== 'Escaped') return;
        
        logEvent(`All players are out in Game #${currentGameNumber}! No winner.`);
        
        saveCompletedGameRecord({
            winnerId: null, winnerName: null, finalistIds: []
        });

        displayWinnerHistory();
    }
    updateAllPlayerDivs();
}

function displayWinnerHistory() {
    populatePreviousWinnersDropdown();
    const historyContainer = document.getElementById('winnerHistoryContainer');
    const historyList = document.getElementById('winnerHistoryList');
    historyList.innerHTML = ''; 

    if (allGamesHistory.length === 0) {
        historyContainer.style.display = 'none';
        return;
    }
    historyContainer.style.display = 'block';

    allGamesHistory.forEach(gameRecord => { 
        const listItem = document.createElement('li');
        let text = `<button onclick="viewArchivedGame(${gameRecord.gameNumber})">View Game</button>
                    <strong>Game #${gameRecord.gameNumber}</strong> (${gameRecord.startingPlayers} started): `;
        
        if (gameRecord.specialOutcome) {
            text += `<strong>${gameRecord.winnerName}</strong>. ${gameRecord.specialOutcome}<br>`;
            text += `Survivors (${gameRecord.finalistIds.length}): ${gameRecord.finalistIds.map(id => createPlayerLink(id)).join(', ')}.`;
            if(gameRecord.prizeSplit > 0) {
                text += `<br>They split ${formatCurrency(gameRecord.fullState.currentPrizePot)}, receiving ${formatCurrency(gameRecord.prizeSplit)} each.`
            }
        } else if (gameRecord.winnerId) {
            text += `Winner: ${createPlayerLink(gameRecord.winnerId)} (${gameRecord.winnerName}). `;
            if (gameRecord.finalistIds && gameRecord.finalistIds.length > 0) {
                text += `Other Finalists: ${gameRecord.finalistIds.map(id => createPlayerLink(id)).join(', ')}.`;
            }
        } else {
            text += "No winner.";
        }
        listItem.innerHTML = text;
        historyList.appendChild(listItem);
    });
}

function togglePlayerStats(span) {
    const detailsDiv = document.getElementById('playerCardStatsDetails');
    const isVisible = detailsDiv.style.display === 'block';
    detailsDiv.style.display = isVisible ? 'none' : 'block';
    span.innerText = isVisible ? '[+]' : '[-]';
}

function showPlayerCard(playerId) {
    const currentPlayers = isViewingHistory ? gameHistorySnapshots[document.getElementById('historySlider').value].players : players;
    const player = currentPlayers.find(p => p.id === playerId);
    if (!player) return;

    currentPlayerCardId = playerId;
    const imgEl = document.getElementById('playerCardImg');
    const urlInputArea = document.getElementById('playerCardUrlInputArea');
    const urlInput = document.getElementById('playerCardUrlInput');
    const editBtn = document.getElementById('playerCardOpenUrlInputBtn');
    const uploadTrigger = document.getElementById('playerCardUploadTrigger');

    imgEl.src = customPlayerPhotos[playerId] || "https://i.imgur.com/AJ3InNO.png";
    urlInput.value = customPlayerPhotos[playerId] || '';
    urlInputArea.style.display = 'none';
    editBtn.textContent = 'Edit Photo URL';

    uploadTrigger.onclick = () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setGameAsModified();
                    customPlayerPhotos[playerId] = e.target.result;
                    imgEl.src = e.target.result;
                    urlInput.value = e.target.result;
                    updateAllPlayerDivs(); 
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };

    editBtn.onclick = () => {
        const isVisible = urlInputArea.style.display === 'block';
        urlInputArea.style.display = isVisible ? 'none' : 'block';
        editBtn.textContent = isVisible ? 'Edit Photo URL' : 'Close Editor';
    };
    
    const favoriteStarHTML = `<span id="playerCardFavoriteStar" class="favorite-star-toggle"></span>`;
    document.getElementById('playerCardName').innerHTML = `P${formatPlayerNumber(player.id)} - ${player.name} ${favoriteStarHTML}`;
    
    const starEl = document.getElementById('playerCardFavoriteStar');
    starEl.innerText = player.isFavorite ? '⭐' : '☆';
    starEl.title = player.isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    starEl.onclick = () => toggleFavoritePlayer(playerId);
    
    if (isViewingHistory || isViewingArchivedGame) {
        starEl.style.cursor = 'not-allowed';
        starEl.style.opacity = '0.5';
        starEl.onclick = () => { alert("Cannot change favorites while viewing history or an archive."); };
    }

    const forceWinnerBtn = document.getElementById('forceWinnerBtn');
    if (forcedWinnerId === player.id) {
        forceWinnerBtn.innerText = 'Undo Forced Winner';
        forceWinnerBtn.style.backgroundColor = '#ffc107'; 
    } else {
        forceWinnerBtn.innerText = 'Make Forced Winner';
        forceWinnerBtn.style.backgroundColor = '';
    }
    forceWinnerBtn.disabled = player.eliminated || player.votedOut;
    forceWinnerBtn.onclick = () => {
        if (isViewingHistory || isViewingArchivedGame) {
            alert("Cannot change this while viewing history or an archive.");
            return;
        }
        toggleForceWinner(player.id);
    };
    
    let statusText = 'Active';
    if (player.eliminated) {
        statusText = `Eliminated (GR ${player.eliminationRound})`;
    } else if (player.votedOut) {
        const reason = player.roundVotedOut === 'Escaped' ? 'Escaped' : `Voted Out (VR ${player.roundVotedOut})`;
        statusText = `Out of Game (${reason})`;
    }
    if (player.isWinner) statusText = 'WINNER';
    else if(player.isFinalist) statusText = 'Finalist';
    if(player.isPreviousWinner && !player.isWinner) statusText += ' (Previous Winner)';
    document.getElementById('playerCardStatus').innerText = statusText;

    document.getElementById('playerCardAge').innerText = player.age;
    document.getElementById('playerCardGender').innerText = player.gender;
    document.getElementById('playerCardCountry').innerText = player.country;
    document.getElementById('playerCardOccupation').innerText = player.occupation;
    document.getElementById('playerCardDebt').innerText = formatCurrency(player.debt);

    const relationEl = document.getElementById('playerCardRelation');
    if (player.relation) {
        relationEl.innerHTML = `${createPlayerLink(player.relation.targetId)} (${player.relation.type})`
    } else if (player.caretakerFor) {
            relationEl.innerHTML = `Caretaker for ${createPlayerLink(player.caretakerFor)}`;
    } else if (player.hasCaretaker) {
            relationEl.innerHTML = `Cared for by ${createPlayerLink(player.hasCaretaker)}`;
    } else {
        relationEl.innerText = 'None';
    }
    const specialConditionEl = document.getElementById('playerCardSpecialCondition');
    if (player.isPregnant) {
        specialConditionEl.textContent = 'Pregnant';
        specialConditionEl.parentElement.style.display = 'block';
    } else if (player.hasBaby) {
        specialConditionEl.textContent = 'Caring for their newborn';
        specialConditionEl.parentElement.style.display = 'block';
    }
    else {
            specialConditionEl.parentElement.style.display = 'none';
    }

    document.getElementById('playerCardAllies').innerHTML = (player.allies && player.allies.length > 0) ? player.allies.map(id => createPlayerLink(id)).join(', ') : 'None';
    document.getElementById('playerCardEnemies').innerHTML = (player.enemies && player.enemies.length > 0) ? `<span class="enemy-text">${player.enemies.map(id => createPlayerLink(id)).join(', ')}</span>` : 'None';
    
    document.getElementById('playerCardInjury').innerText = player.injury
        ? `${player.injury.type} (${player.injury.roundsRemaining} round${player.injury.roundsRemaining > 1 ? 's' : ''} left)`
        : 'None';
    
    const boost = player.allianceBoost || { strength: 0, agility: 0, intelligence: 0, charisma: 0, luck: 0 };
    const displayStat = (elementId, baseStat, boostStat, injuryDebuff = false, injuryAmount = 0) => {
        const el = document.getElementById(elementId);
        let html = `${baseStat} `;
        if (boostStat > 0) html += `<span class="boosted-stat">(+${boostStat})</span> `;
        if (injuryDebuff) html += `<span class="enemy-text">(${injuryAmount > 0 ? '+' : ''}${injuryAmount})</span>`;
        el.innerHTML = html;
    };
    
    displayStat('playerCardStrength', player.baseStats.strength, boost.strength, !!player.injury, -2);
    displayStat('playerCardAgility', player.baseStats.agility, boost.agility, !!player.injury, -2);
    displayStat('playerCardIntelligence', player.baseStats.intelligence, boost.intelligence);
    displayStat('playerCardCharisma', player.baseStats.charisma, boost.charisma);
    displayStat('playerCardLuck', player.baseStats.luck, boost.luck);
    displayStat('playerCardCowardice', player.baseStats.cowardice, 0, !!player.injury, player.injury ? player.injury.cowardiceDebuff : 0);
    document.getElementById('playerCardGreed').innerText = player.baseStats.greed;
    
    const actionLogList = document.getElementById('playerCardActionLog');
    let logHTML = player.actionLog && player.actionLog.length > 0 ? '<ul>' + player.actionLog.slice().map(log => `<li>${linkifyPlayerNumbers(log)}</li>`).join('') + '</ul>' : '<p>No specific actions logged.</p>';
    
    if (season2ModeActive && player.voteHistory && player.voteHistory.length > 0) {
        logHTML += '<h6>Vote History</h6><ul>';
        player.voteHistory.forEach(vh => {
            logHTML += `<li>VR${vh.votingRound}: Voted ${vh.vote}</li>`;
        });
        logHTML += '</ul>';
    }

    actionLogList.innerHTML = logHTML;

    document.getElementById('playerCardElims').innerText = player.eliminationsByPlayer || 0;
    document.getElementById('playerCardHighestAllies').innerText = player.highestAllyCount || 0;

    const debtSplitEl = document.getElementById('playerCardDebtSplit');
    const activePlayersNow = getActivePlayers(currentPlayers);
    
    if (activePlayersNow.length > 0) {
        const prizeSplit = currentPrizePot / activePlayersNow.length;
        const remainingDebt = player.debt - prizeSplit;
        if (remainingDebt > 0) {
            debtSplitEl.innerHTML = `Would still have ${formatCurrency(remainingDebt)} debt.`;
        } else {
            debtSplitEl.innerHTML = `Would gain ${formatCurrency(Math.abs(remainingDebt))}.`;
        }
    } else {
        debtSplitEl.innerText = 'N/A';
    }

    document.getElementById('playerCardStatsDetails').style.display = 'none';
    document.querySelector('#playerCardStatsDetails').previousElementSibling.querySelector('span').innerText = '[+]';


    document.getElementById('playerCardModal').style.display = 'flex';
}

function closePlayerCard(event) {
    if (!event || event.target.id === 'playerCardModal') {
        document.getElementById('playerCardModal').style.display = 'none';
    }
}

function loadPlayerTraits(playerId) {
    const player = players.find(p => p.id == playerId);
    if (player) {
        document.getElementById('traitStrength').value = player.baseStats.strength;
        document.getElementById('traitAgility').value = player.baseStats.agility;
        document.getElementById('traitIntelligence').value = player.baseStats.intelligence;
        document.getElementById('traitCharisma').value = player.baseStats.charisma;
        document.getElementById('traitLuck').value = player.baseStats.luck;
        document.getElementById('traitCowardice').value = player.baseStats.cowardice;
        document.getElementById('traitGreed').value = player.baseStats.greed;
    }
}

function applyTraits() {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    setGameAsModified();
    const playerId = parseInt(document.getElementById('traitPlayerId').value);
    const player = players.find(p => p.id == playerId);
    if (player) {
        player.baseStats.strength = parseInt(document.getElementById('traitStrength').value) || player.baseStats.strength;
        player.baseStats.agility = parseInt(document.getElementById('traitAgility').value) || player.baseStats.agility;
        player.baseStats.intelligence = parseInt(document.getElementById('traitIntelligence').value) || player.baseStats.intelligence;
        player.baseStats.charisma = parseInt(document.getElementById('traitCharisma').value) || player.baseStats.charisma;
        player.baseStats.luck = parseInt(document.getElementById('traitLuck').value) || player.baseStats.luck;
        player.baseStats.cowardice = parseInt(document.getElementById('traitCowardice').value) || player.baseStats.cowardice;
        player.baseStats.greed = parseInt(document.getElementById('traitGreed').value) || player.baseStats.greed;
        logEvent(`Traits manually updated for P${formatPlayerNumber(playerId)}.`);
        updateLeaderboards();
    }
}

function randomizeTraitsForSelectedPlayer() {
    if (isViewingArchivedGame) return;
    const playerId = parseInt(document.getElementById('traitPlayerId').value);
    if (isNaN(playerId)) { alert("Select a player ID first."); return; }
    document.getElementById('traitStrength').value = Math.floor(Math.random() * 10) + 1;
    document.getElementById('traitAgility').value = Math.floor(Math.random() * 10) + 1;
    document.getElementById('traitIntelligence').value = Math.floor(Math.random() * 10) + 1;
    document.getElementById('traitCharisma').value = Math.floor(Math.random() * 10) + 1;
    document.getElementById('traitLuck').value = Math.floor(Math.random() * 10) + 1;
    document.getElementById('traitCowardice').value = Math.floor(Math.random() * 10) + 1;
    document.getElementById('traitGreed').value = Math.floor(Math.random() * 10) + 1;
}

function createAlliance() {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    setGameAsModified();
    const p1Id = parseInt(document.getElementById('allianceP1').value);
    const p2Id = parseInt(document.getElementById('allianceP2').value);
    if (isNaN(p1Id) || isNaN(p2Id) || p1Id === p2Id) { alert("Please enter two different valid player IDs."); return; }
    const p1 = players.find(p => p.id === p1Id && !p.eliminated && !p.votedOut && !p.isBaby);
    const p2 = players.find(p => p.id === p2Id && !p.eliminated && !p.votedOut && !p.isBaby);
    if (p1 && p2) {
        mergeAlliances(p1, p2);
        logEvent(`An alliance has formed between P${formatPlayerNumber(p1Id)} (${p1.name}) and P${formatPlayerNumber(p2Id)} (${p2.name}).`);
        updateAllianceStatBoosts();
        updateAllPlayerDivs();
    } else {
        alert("One or both players are not active in the game.");
    }
}

function removeAlliance() {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    setGameAsModified();
    const p1Id = parseInt(document.getElementById('allianceP1').value);
    const p2Id = parseInt(document.getElementById('allianceP2').value);
    if (isNaN(p1Id) || isNaN(p2Id) || p1Id === p2Id) { alert("Please enter two different valid player IDs."); return; }
    const p1 = players.find(p => p.id === p1Id);
    const p2 = players.find(p => p.id === p2Id);

    if (!p1 || !p2) { alert("One or both players not found."); return; }
    if (!p1.allies.includes(p2Id) || !p2.allies.includes(p1Id)) { alert(`P${formatPlayerNumber(p1Id)} and P${formatPlayerNumber(p2Id)} are not allied.`); return; }

    p1.allies = p1.allies.filter(id => id !== p2Id);
    p2.allies = p2.allies.filter(id => id !== p1Id);
    
    p1.actionLog.push(`GR ${round}: Alliance with P${formatPlayerNumber(p2Id)} was broken.`);
    p2.actionLog.push(`GR ${round}: Alliance with P${formatPlayerNumber(p1Id)} was broken.`);
    logEvent(`The alliance between P${formatPlayerNumber(p1Id)} and P${formatPlayerNumber(p2Id)} has been broken.`);
    
    updateAllianceStatBoosts();
    updateAllPlayerDivs();
}

function createEnemy(){
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    setGameAsModified();
    const p1Id = parseInt(document.getElementById('enemyP1').value);
    const p2Id = parseInt(document.getElementById('enemyP2').value);
    if (isNaN(p1Id) || isNaN(p2Id) || p1Id === p2Id) { alert("Please enter two different valid player IDs."); return; }
    const p1 = players.find(p => p.id === p1Id && !p.eliminated && !p.votedOut && !p.isBaby);
    const p2 = players.find(p => p.id === p2Id && !p.eliminated && !p.votedOut && !p.isBaby);

    if(p1 && p2){
        if(!p1.enemies.includes(p2Id)) p1.enemies.push(p2Id);
        if(!p2.enemies.includes(p1Id)) p2.enemies.push(p1Id);
        p1.actionLog.push(`GR ${round}: Became enemies with P${formatPlayerNumber(p2Id)}.`);
        p2.actionLog.push(`GR ${round}: Became enemies with P${formatPlayerNumber(p1Id)}.`);
        logEvent(`A rivalry has started between P${formatPlayerNumber(p1Id)} and P${formatPlayerNumber(p2Id)}!`);
    } else {
        alert("One or both players are not active in the game.");
    }
}

function removeEnemy() {
    if (isViewingArchivedGame) return;
    if(isViewingHistory) { alert("Cannot perform actions while viewing history. Please Return to Live."); return; }
    setGameAsModified();
    const p1Id = parseInt(document.getElementById('enemyP1').value);
    const p2Id = parseInt(document.getElementById('enemyP2').value);
    if (isNaN(p1Id) || isNaN(p2Id) || p1Id === p2Id) { alert("Please enter two different valid player IDs."); return; }
    const p1 = players.find(p => p.id === p1Id);
    const p2 = players.find(p => p.id === p2Id);

    if (!p1 || !p2) { alert("One or both players not found."); return; }
    if (!p1.enemies.includes(p2Id) || !p2.enemies.includes(p1Id)) { alert(`P${formatPlayerNumber(p1Id)} and P${formatPlayerNumber(p2Id)} are not enemies.`); return; }

    p1.enemies = p1.enemies.filter(id => id !== p2Id);
    p2.enemies = p2.enemies.filter(id => id !== p1Id);

    p1.actionLog.push(`GR ${round}: Made up with enemy P${formatPlayerNumber(p2Id)}.`);
    p2.actionLog.push(`GR ${round}: Made up with enemy P${formatPlayerNumber(p1Id)}.`);
    logEvent(`P${formatPlayerNumber(p1Id)} and P${formatPlayerNumber(p2Id)} have made up.`);
}

function createRelation() {
    if (isViewingArchivedGame) return;
    setGameAsModified();
    const p1Id = parseInt(document.getElementById('relationP1').value);
    const p2Id = parseInt(document.getElementById('relationP2').value);
    const type = document.getElementById('relationType').value;

    if (isNaN(p1Id) || isNaN(p2Id) || p1Id === p2Id) {
        alert("Please enter two different, valid player IDs.");
        return;
    }

    const p1 = players.find(p => p.id === p1Id && !p.eliminated && !p.votedOut);
    const p2 = players.find(p => p.id === p2Id && !p.eliminated && !p.votedOut);

    if (!p1 || !p2) {
        alert("One or both players not found or not active.");
        return;
    }
    if (p1.relation || p2.relation) {
        alert("One or both players already have a special relation.");
        return;
    }

    const validation = {
        'Mother': { p1Gender: 'Female', p2Gender: null, ageDiff: (p1.age > p2.age + 16) },
        'Father': { p1Gender: 'Male', p2Gender: null, ageDiff: (p1.age > p2.age + 16) },
        'Daughter': { p1Gender: 'Female', p2Gender: null, ageDiff: (p2.age > p1.age + 16) },
        'Son': { p1Gender: 'Male', p2Gender: null, ageDiff: (p2.age > p1.age + 16) },
        'Wife': { p1Gender: 'Female', p2Gender: 'Male', ageDiff: true },
        'Husband': { p1Gender: 'Male', p2Gender: 'Female', ageDiff: true },
        'Friend': { p1Gender: null, p2Gender: null, ageDiff: true }
    };

    const rule = validation[type];
    if (rule) {
        if (rule.p1Gender && p1.gender !== rule.p1Gender) {
            alert(`Error: Player 1 (P${p1Id}) must be ${rule.p1Gender} to be a ${type}.`);
            return;
        }
        if (rule.p2Gender && p2.gender !== rule.p2Gender) {
            alert(`Error: Player 2 (P${p2Id}) must be ${rule.p2Gender} for P${p1Id} to be a ${type}.`);
            return;
        }
        if (!rule.ageDiff) {
            alert(`Age gap is not realistic for a ${type} relation.`);
            return;
        }
    }
    
    let p2Type;
    switch (type) {
        case 'Mother': p2Type = p2.gender === 'Male' ? 'Son' : 'Daughter'; break;
        case 'Father': p2Type = p2.gender === 'Male' ? 'Son' : 'Daughter'; break;
        case 'Daughter': p2Type = p2.gender === 'Male' ? 'Father' : 'Mother'; break;
        case 'Son': p2Type = p2.gender === 'Male' ? 'Father' : 'Mother'; break;
        case 'Wife': p2Type = 'Husband'; break;
        case 'Husband': p2Type = 'Wife'; break;
        case 'Friend': p2Type = 'Friend'; break;
    }

    p1.relation = { type: type, targetId: p2.id };
    p2.relation = { type: p2Type, targetId: p1.id };
    mergeAlliances(p1, p2);

    logEvent(`A relationship has been manually set: ${createPlayerLink(p1.id)} is now the ${type} of ${createPlayerLink(p2.id)}.`);
    alert(`Relationship created successfully!`);
}

function removeRelation() {
    if (isViewingArchivedGame) return;
    setGameAsModified();
    const p1Id = parseInt(document.getElementById('removeRelationP1').value);
    if (isNaN(p1Id)) {
        alert("Please enter a valid player ID.");
        return;
    }
    const p1 = players.find(p => p.id === p1Id);
    if (!p1) { alert(`Player ${formatPlayerNumber(p1Id)} not found.`); return; }
    if (!p1.relation) { alert(`Player ${formatPlayerNumber(p1Id)} has no special relation to remove.`); return; }
    
    const p2Id = p1.relation.targetId;
    const p2 = players.find(p => p.id === p2Id);
    
    p1.relation = null;
    if(p2) p2.relation = null;
    
    logEvent(`The special relationship between ${createPlayerLink(p1.id)} and ${createPlayerLink(p2Id)} has been removed.`);
    alert("Relationship removed.")
}

function removePregnancy() {
    if (isViewingArchivedGame) return;
    setGameAsModified();
    const playerId = parseInt(document.getElementById('pregnantPlayerId').value);
    if (isNaN(playerId)) {
        alert("Please enter a valid Player ID.");
        return;
    }
    const player = players.find(p => p.id === playerId);
    if (!player) { alert(`Player ${formatPlayerNumber(playerId)} not found.`); return; }
    if (!player.isPregnant) { alert(`Player ${formatPlayerNumber(playerId)} is not pregnant.`); return; }

    player.isPregnant = false;
    player.protection = Math.max(0, player.protection - 1);
    
    if (player.protection === 0 && !personalityPlayers.has(player.id)) {
        superpoweredPlayerIds.delete(player.id);
    }

    logEvent(`Pregnancy was manually removed from ${createPlayerLink(player.id)}.`);
    alert(`Pregnancy removed from Player ${formatPlayerNumber(playerId)}.`);
    updateAllPlayerDivs();
    updateSuperpowerList();
}

function makePlayerPregnant() {
    if (isViewingArchivedGame) return;
    setGameAsModified();
    const playerId = parseInt(document.getElementById('pregnantPlayerId').value);
    if (isNaN(playerId)) {
        alert("Please enter a valid Player ID.");
        return;
    }

    const player = players.find(p => p.id === playerId && !p.eliminated && !p.votedOut);
    if (!player) {
        alert(`Active player P${formatPlayerNumber(playerId)} not found.`);
        return;
    }

    if (player.gender !== 'Female') {
        alert(`Error: Player ${formatPlayerNumber(playerId)} is not female and cannot be made pregnant.`);
        return;
    }

    if (player.isPregnant) {
        alert(`Player ${formatPlayerNumber(playerId)} is already pregnant.`);
        return;
    }
    
    player.isPregnant = true;
    player.protection += 1;
    superpoweredPlayerIds.add(player.id);
    
    logEvent(`${createPlayerLink(player.id)} was manually made pregnant and has received protection.`);
    alert(`Player ${formatPlayerNumber(playerId)} is now pregnant!`);
    updateAllPlayerDivs();
    updateSuperpowerList();
}

function mergeAlliances(player1, player2) {
    if (!player1 || !player2 || player1.allies.includes(player2.id)) return;
    
    let oldGroupIds = [];
    if (player1.allies.length > 0) oldGroupIds.push([player1.id, ...player1.allies].sort((a,b) => a-b).join('-'));
    if (player2.allies.length > 0) oldGroupIds.push([player2.id, ...player2.allies].sort((a,b) => a-b).join('-'));
    
    const existingColor = oldGroupIds.map(id => persistentGroupColors[id]).find(color => color);
    
    const group = new Set([player1.id, player2.id, ...player1.allies, ...player2.allies]);
    
    group.forEach(memberId => {
        const member = players.find(p => p.id === memberId);
        if(member) {
            const otherMembers = [...group].filter(id => id !== memberId);
            const newAllies = otherMembers.filter(id => !member.allies.includes(id));
            newAllies.forEach(newAllyId => {
                if (member.actionLog) member.actionLog.push(`(Formed alliance with P${formatPlayerNumber(newAllyId)})`);
            });
            member.allies = otherMembers;
            updateHighestAllyCount(member);
        }
    });
    
    if (existingColor) {
        const newGroupId = [...group].sort((a,b) => a-b).join('-');
        persistentGroupColors[newGroupId] = existingColor;
    }

    oldGroupIds.forEach(id => delete persistentGroupColors[id]);
}


function updateAllianceStatBoosts() {
    players.forEach(p => {
        p.allianceBoost = { strength: 0, agility: 0, intelligence: 0, charisma: 0, luck: 0 };
        if (!p.eliminated && !p.votedOut) {
            if (p.allies) {
                p.allies = p.allies.filter(allyId => {
                    const allyIsActive = players.some(player => player.id === allyId && !player.eliminated && !player.votedOut);
                    if (!allyIsActive && p.allies.includes(allyId)) {
                            if(p.actionLog) p.actionLog.push(`(Ally P${formatPlayerNumber(allyId)} was eliminated).`);
                    }
                    return allyIsActive;
                });
                const boostAmount = p.allies.length * 2;
                p.allianceBoost.strength = boostAmount;
                p.allianceBoost.agility = boostAmount;
                p.allianceBoost.intelligence = boostAmount;
                p.allianceBoost.charisma = boostAmount;
                p.allianceBoost.luck = boostAmount;
            }
                if (p.enemies) {
                p.enemies = p.enemies.filter(enemyId => players.some(player => player.id === enemyId && !player.eliminated && !player.votedOut));
                }
        }
    });
    updateLeaderboards();
}

function updateRelationships() {
    const activePlayers = getActivePlayers();
    
    let processedPairs = new Set();
    activePlayers.forEach(p => {
        if (!p.allies) return;
        [...p.allies].forEach(allyId => {
            const pairKey = [p.id, allyId].sort().join('-');
            if (processedPairs.has(pairKey)) return;
            processedPairs.add(pairKey);

            if (Math.random() < 0.01) {
                const ally = players.find(player => player.id === allyId);
                if (!ally || ally.eliminated || ally.votedOut) return;

                p.allies = p.allies.filter(id => id !== allyId);
                ally.allies = ally.allies.filter(id => id !== p.id);

                if(!p.enemies.includes(allyId)) p.enemies.push(allyId);
                if(!ally.enemies.includes(p.id)) ally.enemies.push(p.id);

                const logMsg = `Betrayal! ${createPlayerLink(p.id)}'s ally, ${createPlayerLink(ally.id)}, has turned against them!`;
                logEvent(logMsg);
                p.actionLog.push(`Event: Betrayed by ally ${createPlayerLink(ally.id)}.`);
                ally.actionLog.push(`Event: Turned on former ally ${createPlayerLink(p.id)}.`);
            }
        });
    });
    
    let newAllianceLogs = [];
    let newEnemyLogs = [];
    let processedPlayerIds = new Set();
    
    activePlayers.forEach(p => {
        if (processedPlayerIds.has(p.id)) return;

        if (p.allies.length < 2 && Math.random() < getEffectiveStat(p, 'charisma') / 80) {
            let potentialAllies = activePlayers.filter(other => 
                other.id !== p.id && !p.allies.includes(other.id) && !p.enemies.includes(other.id) && !processedPlayerIds.has(other.id)
            );
            if (potentialAllies.length > 0) {
                const newAlly = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                newAllianceLogs.push(`P${formatPlayerNumber(p.id)} & P${formatPlayerNumber(newAlly.id)}`);
                mergeAlliances(p, newAlly);
                processedPlayerIds.add(p.id);
                processedPlayerIds.add(newAlly.id);
                return; 
            }
        }

            if (Math.random() < (getEffectiveStat(p, 'greed') - getEffectiveStat(p, 'charisma') + getEffectiveStat(p, 'cowardice')) / 100) {
                let potentialEnemies = activePlayers.filter(other => 
                other.id !== p.id && !p.allies.includes(other.id) && !p.enemies.includes(other.id) && !processedPlayerIds.has(other.id)
            );
                if (potentialEnemies.length > 0) {
                const newEnemy = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
                if(!p.enemies.includes(newEnemy.id)) p.enemies.push(newEnemy.id);
                if(!newEnemy.enemies.includes(p.id)) newEnemy.enemies.push(p.id);
                
                p.actionLog.push(`GR ${round}: Became enemies with P${formatPlayerNumber(newEnemy.id)}.`);
                newEnemy.actionLog.push(`GR ${round}: Became enemies with P${formatPlayerNumber(p.id)}.`);
                newEnemyLogs.push(`P${formatPlayerNumber(p.id)} vs P${formatPlayerNumber(newEnemy.id)}`);
                processedPlayerIds.add(p.id);
                processedPlayerIds.add(newEnemy.id);
                }
        }
    });

    if (newAllianceLogs.length > 0) {
        logEvent(`${newAllianceLogs.length} new alliance(s) have formed.`, `New Pairs: ${newAllianceLogs.join('; ')}`);
    }
    if (newEnemyLogs.length > 0) {
        logEvent(`${newEnemyLogs.length} new rivalr(y/ies) have started.`, `New Enemies: ${newEnemyLogs.join('; ')}`);
    }
    
    updateAllianceStatBoosts();
}

function frontManIntervention() {
        const activePlayers = getActivePlayers().filter(p => p.id !== player001VIP_Id);
        if (activePlayers.length > 0) {
            const unluckyPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            unluckyPlayer.eliminated = true;
            unluckyPlayer.eliminationRound = round;
            playSound('elimination');
            logEvent(`FRONT MAN INTERVENTION: P${formatPlayerNumber(unluckyPlayer.id)} (${unluckyPlayer.name}) was eliminated for breaking the spirit of the game.`);
            currentPrizePot += 100000;
            updateAllianceStatBoosts();
            
            eliminationOrder.push({ isHeader: true, round: round, text: `Event: Front Man Intervention` });
            handleEliminationProcessing([unluckyPlayer], "was eliminated by the Front Man", false, "Front Man Intervention");
        }
}

function handleTugOfWar() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Tug of War): Not enough players to form two teams.`);
        updateCounters(); return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Tug of War` });
    
    let teamA = [], teamB = [];
    let sortedPlayers = [...activePlayers].sort((a,b) => b.allies.length - a.allies.length);
    let assignedIds = new Set();
    
    sortedPlayers.forEach(p => {
        if (assignedIds.has(p.id)) return;
        const allianceGroup = [p, ...p.allies.map(id => players.find(ally => ally.id === id)).filter(Boolean)];
        const uniqueAllianceMembers = [...new Set(allianceGroup)].filter(ap => !assignedIds.has(ap.id));
        if (teamA.length <= teamB.length) teamA.push(...uniqueAllianceMembers);
        else teamB.push(...uniqueAllianceMembers);
        uniqueAllianceMembers.forEach(member => assignedIds.add(member.id));
    });

    while (teamA.length > teamB.length + 1) teamB.push(teamA.pop());
    while (teamB.length > teamA.length + 1) teamA.push(teamB.pop());

    if (teamA.length === 0 || teamB.length === 0) {
        logEvent(`GR ${round} (Tug of War): Could not form two viable teams.`); return;
    }

    let teamAStrength = teamA.reduce((sum, p) => sum + getEffectiveStat(p, 'strength') + getEffectiveStat(p, 'luck') / 2, 0) * (Math.random() * 0.4 + 0.8);
    let teamBStrength = teamB.reduce((sum, p) => sum + getEffectiveStat(p, 'strength') + getEffectiveStat(p, 'luck') / 2, 0) * (Math.random() * 0.4 + 0.8);

    let [winningTeam, losingTeam] = teamAStrength >= teamBStrength ? [teamA, teamB] : [teamB, teamA];
    let [winningTeamName, losingTeamName] = teamAStrength >= teamBStrength ? ['Team A', 'Team B'] : ['Team B', 'Team A'];
    
    const survivorOnLosingTeam = losingTeam.find(p => checkSurvivalMechanics(p, "Tug of War"));
    if (survivorOnLosingTeam) {
        logEvent(`${createPlayerLink(survivorOnLosingTeam.id)}'s special survival saved their ENTIRE TEAM from failing Tug of War!`);
        let temp = winningTeam;
        winningTeam = losingTeam;
        losingTeam = temp;
        temp = winningTeamName;
        winningTeamName = losingTeamName;
        losingTeamName = temp;
    }

    const teamA_details_list = teamA.map(p => `P${formatPlayerNumber(p.id)}`).join(', ');
    const teamB_details_list = teamB.map(p => `P${formatPlayerNumber(p.id)}`).join(', ');
    const winnerStrength = (winningTeamName === 'Team A' ? teamAStrength: teamBStrength).toFixed(0);
    const loserStrength = (losingTeamName === 'Team A' ? teamAStrength : teamBStrength).toFixed(0);
    const details = `<b>Team A (${teamA.length} players)</b>: ${teamA_details_list}<br><b>Team B (${teamB.length} players)</b>: ${teamB_details_list}<hr>${winningTeamName} (Effective Str ${winnerStrength}) defeats ${losingTeamName} (Effective Str ${loserStrength}).${survivorOnLosingTeam ? ` Thanks to ${createPlayerLink(survivorOnLosingTeam.id)}!` : ''}`;
    
    winningTeam.forEach(s => s.actionLog.push(`GR ${round}: Passed Tug of War on ${winningTeamName}.`));
    losingTeam.forEach(loser => loser.actionLog.push(`GR ${round}: Failed Tug of War on ${losingTeamName}.`));

    let eliminatedThisRound = [...losingTeam];
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`lost Tug of War.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `lost Tug of War.`, false, 'Tug of War', false, false, details);
    }
}

    function handleDodgeball() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Dodgeball): Not enough players for two teams.`);
        updateCounters(); return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Dodgeball` });

    let shuffled = [...activePlayers].sort(() => 0.5 - Math.random());
    const midPoint = Math.ceil(shuffled.length / 2);
    const teamRed = shuffled.slice(0, midPoint);
    const teamBlue = shuffled.slice(midPoint);

    teamRed.forEach(p => p.gameRole = 'Red');
    teamBlue.forEach(p => p.gameRole = 'Blue');
    
    let details = `<b>Red Team:</b> ${teamRed.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}<br><b>Blue Team:</b> ${teamBlue.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}<hr>`;

    activePlayers.forEach(p => {
        p.survivalScore = (getEffectiveStat(p, 'agility') * 1.5) + getEffectiveStat(p, 'strength') + (getEffectiveStat(p, 'luck') / 2) + (Math.random() * 5);
    });

    activePlayers.sort((a,b) => a.survivalScore - b.survivalScore);
    const numToEliminate = Math.floor(activePlayers.length * 0.5);
    
    let eliminatedThisRound = [];
    let toEliminate = activePlayers.slice(0, numToEliminate);

    toEliminate.forEach(p => {
        if (!checkSurvivalMechanics(p, "Dodgeball")) {
            eliminatedThisRound.push(p);
        }
    });

    const survivors = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));
    
    eliminatedThisRound.forEach(eliminatedPlayer => {
        const opposingTeam = eliminatedPlayer.gameRole === 'Red' ? 'Blue' : 'Red';
        const survivingOpponents = survivors.filter(s => s.gameRole === opposingTeam);
        
        let hitter = null;
        if (survivingOpponents.length > 0) {
            let enemiesOnOpposingTeam = survivingOpponents.filter(s => s.enemies.includes(eliminatedPlayer.id));
            if (enemiesOnOpposingTeam.length > 0 && Math.random() < 0.7) { 
                hitter = enemiesOnOpposingTeam[Math.floor(Math.random() * enemiesOnOpposingTeam.length)];
            } else {
                hitter = survivingOpponents[Math.floor(Math.random() * survivingOpponents.length)];
            }
        }

        if(hitter){
            creditElimination(hitter.id, eliminatedPlayer.id);
            eliminatedPlayer.actionLog.push(`GR ${round}: Was hit by P${formatPlayerNumber(hitter.id)} in Dodgeball (Team ${eliminatedPlayer.gameRole}).`);
            hitter.actionLog.push(`GR ${round}: Hit P${formatPlayerNumber(eliminatedPlayer.id)} in Dodgeball (Team ${hitter.gameRole}).`);
            details += `P${formatPlayerNumber(hitter.id)} (${hitter.gameRole}) hit P${formatPlayerNumber(eliminatedPlayer.id)} (${eliminatedPlayer.gameRole}).<br>`;
        } else {
                eliminatedPlayer.actionLog.push(`GR ${round}: Was hit by an unknown opponent in Dodgeball (Team ${eliminatedPlayer.gameRole}).`);
                details += `P${formatPlayerNumber(eliminatedPlayer.id)} (${eliminatedPlayer.gameRole}) was hit.<br>`;
        }
    });

    survivors.forEach(s => {
            if (!s.actionLog.some(log => log.includes(`GR ${round}:`))) {
                s.actionLog.push(`GR ${round}: Survived Dodgeball (Team ${s.gameRole}).`);
            }
    });
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`were hit in Dodgeball.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `were hit in Dodgeball.`, false, 'Dodgeball', false, false, details);
    }
}


function handleHotPotato() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Hot Potato): Not enough players.`);
        updateCounters(); return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Hot Potato` });

    const numToEliminate = Math.floor(activePlayers.length * 0.75);
    if (numToEliminate === 0) {
            logEvent(`GR ${round} (Hot Potato): No one was eliminated.`);
            return;
    }

    activePlayers.forEach(p => {
        p.eliminationRisk = 50 - (getEffectiveStat(p, 'luck') * 2.5);
        p.randomSortKey = Math.random(); 
    });
    
    let sortedForElim = [...activePlayers].sort((a, b) => b.eliminationRisk - a.eliminationRisk || a.randomSortKey - b.randomSortKey);
    
    const eliminatedThisRound = [];
    let toEliminate = sortedForElim.slice(0, numToEliminate);

    toEliminate.forEach(p => {
            if (!checkSurvivalMechanics(p, "Hot Potato")) {
            eliminatedThisRound.push(p);
        }
    });

    let details = "Elimination Details:<br>";
    const survivors = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));

    eliminatedThisRound.forEach(eliminatedPlayer => {
        let potentialPassers = survivors.filter(p => p.id !== eliminatedPlayer.id);

        if(potentialPassers.length > 0){
            const passerObjects = [];
            const passerWeights = [];

            potentialPassers.forEach(passer => {
                let animosityScore = 20;
                if (passer.enemies.includes(eliminatedPlayer.id)) animosityScore += 100;
                if (passer.allies.includes(eliminatedPlayer.id)) animosityScore = Math.max(1, animosityScore - 50); 
                animosityScore += getEffectiveStat(passer, 'greed') * 1.5;
                passerObjects.push(passer);
                passerWeights.push(animosityScore);
            });

            const bestPasser = getWeightedRandom(passerObjects, passerWeights);

            if (bestPasser) {
                creditElimination(bestPasser.id, eliminatedPlayer.id);
                eliminatedPlayer.actionLog.push(`GR ${round}: Was passed the final potato by P${formatPlayerNumber(bestPasser.id)}.`);
                bestPasser.actionLog.push(`GR ${round}: Passed the final potato to P${formatPlayerNumber(eliminatedPlayer.id)}.`);
                details += `P${formatPlayerNumber(eliminatedPlayer.id)} was eliminated by a potato from P${formatPlayerNumber(bestPasser.id)}.<br>`;
            } else {
                    eliminatedPlayer.actionLog.push(`GR ${round}: Was left with the potato at the end.`);
                    details += `P${formatPlayerNumber(eliminatedPlayer.id)} was left holding the potato.<br>`;
            }
        } else {
                eliminatedPlayer.actionLog.push(`GR ${round}: Was left with the potato at the end.`);
                details += `P${formatPlayerNumber(eliminatedPlayer.id)} was left holding the potato.<br>`;
        }
    });
    
    survivors.forEach(s => {
            if (!s.actionLog.some(log => log.includes(`GR ${round}:`))) {
                s.actionLog.push(`GR ${round}: Passed Hot Potato.`);
            }
    });
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`failed Hot Potato.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `failed Hot Potato.`, false, 'Hot Potato', false, false, details);
    }
}

function handleMarbles() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Marbles): Not enough players to form a pair.`);
        updateCounters(); return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Marbles` });

    let assignedPlayerIds = new Set();
    let pairs = [];
    
    activePlayers.forEach(p => {
        if (assignedPlayerIds.has(p.id)) return;
        const potentialAllies = p.allies.map(id => players.find(ally => ally.id === id && !assignedIds.has(id) && !ally.eliminated && !ally.votedOut)).filter(Boolean);
        if (potentialAllies.length > 0 && Math.random() < 0.80) {
            const partner = potentialAllies[0];
            pairs.push([p, partner]);
            assignedPlayerIds.add(p.id);
            assignedPlayerIds.add(partner.id);
        }
    });

    let unassignedPlayers = activePlayers.filter(p => !assignedPlayerIds.has(p.id));
    unassignedPlayers.sort(() => 0.5 - Math.random());
    
    while (unassignedPlayers.length >= 2) {
        pairs.push([unassignedPlayers.pop(), unassignedPlayers.pop()]);
    }
    
    let eliminatedThisRound = [];
    let details = "Pairings and Results:<br>";
    
        pairs.forEach(([p1, p2]) => {
        if (Math.random() < 0.02) {
            if (!checkSurvivalMechanics(p1, "Marbles")) eliminatedThisRound.push(p1);
            if (!checkSurvivalMechanics(p2, "Marbles")) eliminatedThisRound.push(p2);
            details += `P${formatPlayerNumber(p1.id)} & P${formatPlayerNumber(p2.id)} ran out of time. DOUBLE ELIMINATION.<br>`;
            return;
        }

        let provisionalWinner, provisionalLoser, reason = "";
        let betrayed = false;

        const p1_isProtected = p1.protection > 0 || p1.hasHint;
        const p2_isProtected = p2.protection > 0 || p2.hasHint;

        if (p1_isProtected && !p2_isProtected) {
            provisionalWinner = p1; provisionalLoser = p2; reason = "due to protection";
        } else if (p2_isProtected && !p1_isProtected) {
            provisionalWinner = p2; provisionalLoser = p1; reason = "due to protection";
        } else { 
            const p1Allied = p1.allies.includes(p2.id);
            if (p1Allied) {
                if (getEffectiveStat(p1, 'greed') > getEffectiveStat(p2, 'greed') + 3 && Math.random() < getEffectiveStat(p1, 'greed') / 15) {
                    provisionalWinner = p1; provisionalLoser = p2; betrayed = true;
                } else if (getEffectiveStat(p2, 'greed') > getEffectiveStat(p1, 'greed') + 3 && Math.random() < getEffectiveStat(p2, 'greed') / 15) {
                    provisionalWinner = p2; provisionalLoser = p1; betrayed = true;
                }
            }

            if (!provisionalWinner) {
                const p1Score = getEffectiveStat(p1, 'intelligence') + getEffectiveStat(p1, 'luck') * 1.5 + Math.random() * 5;
                const p2Score = getEffectiveStat(p2, 'intelligence') + getEffectiveStat(p2, 'luck') * 1.5 + Math.random() * 5;
                provisionalWinner = p1Score >= p2Score ? p1 : p2;
                provisionalLoser = p1Score < p2Score ? p1 : p2;
            }
            reason = betrayed ? "by betrayal" : "";
        }

        if (checkSurvivalMechanics(provisionalLoser, "Marbles")) {
            const actualWinner = provisionalLoser;
            const actualLoser = provisionalWinner;
            
            details += `P${formatPlayerNumber(p1.id)} vs P${formatPlayerNumber(p2.id)} -> An upset! P${formatPlayerNumber(actualWinner.id)} survives against the odds, eliminating P${formatPlayerNumber(actualLoser.id)}.<br>`;
            eliminatedThisRound.push(actualLoser);
            
            actualWinner.actionLog.push(`GR ${round}: Survived Marbles against P${formatPlayerNumber(actualLoser.id)} due to a special intervention.`);
            actualLoser.actionLog.push(`GR ${round}: Lost Marbles against P${formatPlayerNumber(actualWinner.id)} after their win was overridden.`);
        } else {
            const actualWinner = provisionalWinner;
            const actualLoser = provisionalLoser;

            creditElimination(actualWinner.id, actualLoser.id);
            eliminatedThisRound.push(actualLoser);

            if (reason === "due to protection") {
                checkSurvivalMechanics(actualWinner, "Marbles");
            }
            
            actualWinner.actionLog.push(`GR ${round}: Won Marbles against P${formatPlayerNumber(actualLoser.id)} ${reason}.`);
            actualLoser.actionLog.push(`GR ${round}: Lost Marbles against P${formatPlayerNumber(actualWinner.id)} ${reason}.`);
            details += `P${formatPlayerNumber(p1.id)} vs P${formatPlayerNumber(p2.id)} -> P${formatPlayerNumber(actualWinner.id)} wins${betrayed ? ' (Betrayal!)':''}.<br>`;
        }
    });
    
    const survivors = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));
    unassignedPlayers.forEach(s => {
            s.actionLog.push(`GR ${round}: Survived Marbles due to no partner.`);
            details += `P${formatPlayerNumber(s.id)} (${s.name}) had no partner and survived.<br>`;
    });
    survivors.forEach(s => {
            if (!s.actionLog.some(log => log.includes(`GR ${round}:`))) {
                s.actionLog.push(`GR ${round}: Passed Marbles.`);
            }
    });
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`lost their marbles.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `lost their marbles.`, false, 'Marbles', false, false, details);
    }
}

function handleDalgona() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    let eliminatedThisRound = [];
    let details = "Shape Choices and Results:<br>";

    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Dalgona` });

    activePlayers.forEach(p => {
        let shape;
        const intelBias = getEffectiveStat(p, 'intelligence') / 15;
        if (Math.random() < intelBias) {
            shape = Math.random() < 0.5 ? 'Circle' : 'Triangle';
        } else {
            shape = Math.random() < 0.5 ? 'Star' : 'Umbrella';
        }
        
        let survivalChance;
        switch(shape) {
            case 'Circle': survivalChance = 0.90; break;
            case 'Triangle': survivalChance = 0.80; break;
            case 'Star': survivalChance = 0.45; break;
            case 'Umbrella': survivalChance = 0.15; break;
        }

        survivalChance += (getEffectiveStat(p, 'agility')*1.5 + getEffectiveStat(p, 'intelligence') + getEffectiveStat(p, 'luck')/2) / 110;
        survivalChance = Math.min(0.99, survivalChance); 

        if (Math.random() > survivalChance) {
                if (checkSurvivalMechanics(p, "Dalgona")) {
                details += `P${formatPlayerNumber(p.id)} (${p.name}) failed the ${shape} but was protected.<br>`;
                } else {
                eliminatedThisRound.push(p);
                details += `P${formatPlayerNumber(p.id)} (${p.name}) failed the ${shape}.<br>`;
                p.actionLog.push(`GR ${round}: Failed Dalgona (Shape: ${shape}).`);
                }
        } else {
                details += `P${formatPlayerNumber(p.id)} (${p.name}) passed the ${shape}.<br>`;
                p.actionLog.push(`GR ${round}: Passed Dalgona (Shape: ${shape}).`);
        }
    });
    
    eliminatedThisRound.sort(() => Math.random() - 0.5);

    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`failed Dalgona.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `failed Dalgona.`, false, 'Dalgona', false, false, details);
    }
}

function handlePentathlon() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length === 0) { logEvent(`GR ${round} (Pentathlon): No players.`); return; }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Pentathlon` });

    activePlayers.forEach(p => p.hasFormedPentathlonAlliance = false);

    let teams = [];
    let processedPlayerIds = new Set();
    let remainingPlayers = [...activePlayers];
    
    activePlayers.forEach(p => {
        if (processedPlayerIds.has(p.id)) return;
        const alliesAndSelf = [p, ...p.allies.map(id => players.find(player => player.id === id)).filter(Boolean)];
        const team = alliesAndSelf.filter(player => !processedPlayerIds.has(player.id));
        if (team.length > 1) {
            teams.push(team);
            team.forEach(member => processedPlayerIds.add(member.id));
        }
    });
    
    remainingPlayers = activePlayers.filter(p => !processedPlayerIds.has(p.id));
    for (let i = remainingPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingPlayers[i], remainingPlayers[j]] = [remainingPlayers[j], remainingPlayers[i]];
    }
    
    teams.forEach(team => { while (team.length < 5 && remainingPlayers.length > 0) team.push(remainingPlayers.pop()); });
    while (remainingPlayers.length > 0) teams.push(remainingPlayers.splice(0, 5));
    
    let avgPlayerScoreStat = activePlayers.length > 0 ? activePlayers.reduce((sum, p) => sum + getEffectiveStat(p, 'strength') + getEffectiveStat(p, 'agility') + getEffectiveStat(p, 'intelligence'), 0) / activePlayers.length : 0;
    let teamScores = [];
    
    teams.forEach(team => {
        const teamMemberStr = team.map(p => `P${formatPlayerNumber(p.id)}`).join(', ');
        team.forEach(player => player.actionLog.push(`GR ${round}: Was on Pentathlon Team [${teamMemberStr}].`));
        
        let teamScore = team.reduce((sum, p) => sum + getEffectiveStat(p, 'strength') + getEffectiveStat(p, 'agility') + getEffectiveStat(p, 'intelligence'), 0);
        if (team.length < 5) teamScore += (5 - team.length) * avgPlayerScoreStat;
        teamScore += team.reduce((sum, p) => sum + getEffectiveStat(p, 'luck'), 0) * Math.random();
        teamScores.push({ score: teamScore, team: team });
    });

    teamScores.sort((a,b) => a.score - b.score);
    let percentToFail = Math.random() * (0.45 - 0.35) + 0.35; 
    let numTeamsToFail = Math.floor(teams.length * percentToFail);
    
    let failingTeams = teamScores.slice(0, numTeamsToFail);
    let passingTeams = teamScores.slice(numTeamsToFail);
    let details = "Team Results:<br>";
    
    let newPassingTeams = [];
    let newFailingTeams = [];

    for(let teamData of failingTeams) {
        const survivor = teamData.team.find(p => checkSurvivalMechanics(p, "Pentathlon"));
        if (survivor) {
            logEvent(`${createPlayerLink(survivor.id)}'s special survival saved their ENTIRE TEAM from failing Pentathlon!`);
            newPassingTeams.push(teamData); 
        } else {
            newFailingTeams.push(teamData);
        }
    }
    
    if (newPassingTeams.length > 0 && passingTeams.length > 0) {
        for (let i = 0; i < newPassingTeams.length; i++) {
                if (passingTeams.length > 0) {
                const savedTeamData = newPassingTeams[i];
                const weakestPassingTeam = passingTeams.shift();
                newFailingTeams.push(weakestPassingTeam);
                details += `Team [${savedTeamData.team.map(p=>`P${p.id}`).join(',')}] was SAVED! Their failure was passed to Team [${weakestPassingTeam.team.map(p=>`P${p.id}`).join(',')}]!<br>`;
                }
        }
    }
    
    passingTeams.push(...newPassingTeams);
    failingTeams = newFailingTeams;

    let eliminatedThisRound = [];
    failingTeams.forEach(({team}) => {
            details += `Team [${team.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}] FAILED.<br>`;
            team.forEach(player => {
            player.actionLog.push(`GR ${round}: Team FAILED the Pentathlon.`);
            eliminatedThisRound.push(player);
            });
    });
    
    passingTeams.forEach(({team}) => {
        details += `Team [${team.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}] PASSED.<br>`;
        team.forEach(player => player.actionLog.push(`GR ${round}: Team PASSED the Pentathlon.`));
        team.forEach(p1 => {
            if (!p1.eliminated && !p1.hasFormedPentathlonAlliance && Math.random() < 0.03) {
                const potentialAllies = team.filter(p2 => p2.id !== p1.id && !p1.allies.includes(p2.id) && !p1.enemies.includes(p2.id) && !p2.eliminated && !p2.hasFormedPentathlonAlliance);
                if (potentialAllies.length > 0) {
                    const newAlly = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                    mergeAlliances(p1, newAlly);
                    p1.hasFormedPentathlonAlliance = true; newAlly.hasFormedPentathlonAlliance = true;
                    logEvent(`Teamwork pays off! A new alliance formed between P${formatPlayerNumber(p1.id)} and P${formatPlayerNumber(newAlly.id)} after surviving the Pentathlon.`);
                }
            }
        });
    });
    eliminatedThisRound.sort(() => Math.random() - 0.5);

    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`failed the Pentathlon.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `failed the Pentathlon.`, false, 'Pentathlon', false, false, details);
    }
}

function handleGlassBridge() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Glass Bridge` });

    let panelsToCross = activePlayers.length + 2;
    
    let vestNumbers = activePlayers.map((p, i) => i + 1);
    for (let i = vestNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vestNumbers[i], vestNumbers[j]] = [vestNumbers[j], vestNumbers[i]];
    }
    activePlayers.forEach((p, i) => {
        p.vestNumber = vestNumbers[i];
        p.actionLog.push(`GR ${round}: Received Vest #${p.vestNumber} for Glass Bridge.`);
    });
    activePlayers.sort((a,b) => a.vestNumber - b.vestNumber);

    let eliminatedThisRound = [];
    let details = "Glass Bridge Crossing Order:<br>";
    let panelsKnown = 0;

    for (const player of activePlayers) {
        if (panelsKnown >= panelsToCross) { 
            details += `P${formatPlayerNumber(player.id)} (Vest ${player.vestNumber}) crossed safely.<br>`;
            continue;
        }

        details += `P${formatPlayerNumber(player.id)} (Vest ${player.vestNumber}) is next... `;
        
        let panelsToGuess = panelsToCross - panelsKnown;
        let survived = true;
        for(let i=0; i<panelsToGuess; i++){
            let eliminationReason = "";
            
            const activeEnemiesBehind = player.enemies.filter(enemyId => activePlayers.some(p => p.id === enemyId && p.vestNumber > player.vestNumber && !eliminatedThisRound.includes(p)));
            let PushedByCaretaker = false;
            if (!player.caretakerFor) {
                const activeCaretakersBehind = activePlayers.filter(p => p.caretakerFor && p.vestNumber > player.vestNumber && p.enemies.includes(player.id));
                if (activeCaretakersBehind.length > 0 && Math.random() < 0.7) {
                    const caretaker = activeCaretakersBehind[0];
                    eliminationReason = `was pushed by an angry caretaker (${createPlayerLink(caretaker.id)}) and fell on panel #${panelsKnown+1}.`;
                    caretaker.actionLog.push(`GR ${round}: Pushed enemy P${formatPlayerNumber(player.id)} off the Glass Bridge to protect the baby.`);
                    creditElimination(caretaker.id, player.id);
                    PushedByCaretaker = true;
                }
            }
            if (!PushedByCaretaker && activeEnemiesBehind.length > 0 && Math.random() < 0.40) {
                const enemy = players.find(p => p.id === activeEnemiesBehind[0]);
                eliminationReason = `was pushed by an enemy and fell on panel #${panelsKnown + 1}.`;
                enemy.actionLog.push(`GR ${round}: Pushed enemy P${formatPlayerNumber(player.id)} off the Glass Bridge.`);
                creditElimination(enemy.id, player.id);
            } else {
                let guessChance = 0.5 + (getEffectiveStat(player, 'luck') - 5) / 200;
                if (Math.random() > guessChance) {
                    eliminationReason = `fell on panel #${panelsKnown + 1}.`;
                }
            }

            if(eliminationReason){
                if(checkSurvivalMechanics(player, "Glass Bridge")) {
                    details += `fell, but was protected!<br>`;
                    panelsKnown++; 
                } else {
                    eliminatedThisRound.push(player);
                    player.actionLog.push(`GR ${round}: ${eliminationReason}`);
                    details += `${eliminationReason} ELIMINATED.<br>`;
                    panelsKnown++; 
                    survived = false;
                }
                break;
            } else {
                panelsKnown++;
            }

        }
        if(survived){
            details += `made it across!<br>`;
        }
    }
    
    const survivors = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));
    survivors.forEach(s => s.actionLog.push(`GR ${round}: Passed Glass Bridge.`));
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`fell from the Glass Bridge.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `fell from the Glass Bridge.`, false, 'Glass Bridge', false, false, details);
    }
}

function handleSquidGame() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Squid Game): Not enough players for the final game.`);
        updateCounters();
        checkFinalistsAndWinner();
        return;
    }

    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Squid Game` });

    let details = `Final Matches for Squid Game:<br>`;
    let eliminatedThisRound = [];

    while (activePlayers.length > 1) {
        for (let i = activePlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [activePlayers[i], activePlayers[j]] = [activePlayers[j], activePlayers[i]];
        }

        const p1 = activePlayers.shift();
        const p2 = activePlayers.shift();
        
        let winner, loser;
        let p1Score = (getEffectiveStat(p1, 'strength') * 1.5) + getEffectiveStat(p1, 'agility');
        let p2Score = (getEffectiveStat(p2, 'strength') * 1.5) + getEffectiveStat(p2, 'agility');

        if(p1.enemies.includes(p2.id)) p1Score *= 1.5;
        if(p2.enemies.includes(p1.id)) p2Score *= 1.5;

        if (Math.random() < 0.90) { 
            winner = p1Score >= p2Score ? p1 : p2;
            loser = p1Score < p2Score ? p1 : p2;
            details += `P${formatPlayerNumber(winner.id)} defeats P${formatPlayerNumber(loser.id)}.<br>`;
        } else { 
            winner = p1Score < p2Score ? p1 : p2;
            loser = p1Score >= p2Score ? p1 : p2;
            details += `UPSET! P${formatPlayerNumber(winner.id)} defeats P${formatPlayerNumber(loser.id)}.<br>`;
        }
        
        if (checkSurvivalMechanics(loser, "Squid Game Finale")) {
            activePlayers.push(loser); 
            details += `... but P${formatPlayerNumber(loser.id)} miraculously survived the encounter!<br>`;
        } else {
                creditElimination(winner.id, loser.id);
                winner.actionLog.push(`GR ${round}: Defeated P${formatPlayerNumber(loser.id)} in Squid Game.`);
                loser.actionLog.push(`GR ${round}: Was defeated by P${formatPlayerNumber(winner.id)} in Squid Game.`);
                eliminatedThisRound.push(loser);
        }
        activePlayers.push(winner); 
    }
    
    activePlayers.forEach(s => s.actionLog.push(`GR ${round}: Passed the final game.`));

    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`failed the final Squid Game.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `failed the final Squid Game.`, false, 'Squid Game', false, false, details);
    }
}

function handleLightsOut() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Lights Out): Not enough players.`);
        return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Lights Out` });

    let eliminatedThisRound = [];
    let details = "Events in the dark:<br>";
    let eliminatedIdsThisRound = new Set();
    
    const killers = activePlayers.filter(p => getEffectiveStat(p, 'greed') >= 8 && getEffectiveStat(p, 'cowardice') <= 5 && !eliminatedIdsThisRound.has(p.id));

    killers.forEach(killer => {
        if (eliminatedIdsThisRound.has(killer.id)) return;

        const killChance = (getEffectiveStat(killer, 'greed') / 12) + ((10 - getEffectiveStat(killer, 'cowardice')) / 35);
        if (Math.random() < killChance) {
            let potentialVictims = activePlayers.filter(p => p.id !== killer.id && !eliminatedIdsThisRound.has(p.id));
            if (potentialVictims.length === 0) return;

            let victim = null;
            const enemyVictims = potentialVictims.filter(p => killer.enemies.includes(p.id));
            if (enemyVictims.length > 0 && Math.random() < 0.85) {
                victim = enemyVictims[Math.floor(Math.random() * enemyVictims.length)];
            } else {
                potentialVictims.sort((a,b) => (getEffectiveStat(a,'strength')+getEffectiveStat(a,'agility')) - (getEffectiveStat(b,'strength')+getEffectiveStat(b,'agility')));
                victim = potentialVictims[0];
            }

            if (!victim) return;

            let killerCombatScore = (getEffectiveStat(killer, 'strength') * 1.5) + getEffectiveStat(killer, 'agility') + (getEffectiveStat(killer, 'luck') / 2);
            let victimCombatScore = (getEffectiveStat(victim, 'strength') * 1.5) + getEffectiveStat(victim, 'agility') + (getEffectiveStat(victim, 'luck') / 2);
            
            let winner, loser;
            if (killerCombatScore >= victimCombatScore) {
                winner = killer;
                loser = victim;
            } else {
                winner = victim;
                loser = killer;
            }
            
            if (!eliminatedIdsThisRound.has(loser.id)) {
                if (checkSurvivalMechanics(loser, "Lights Out", true)) {
                    details += `${createPlayerLink(winner.id)} attacked ${createPlayerLink(loser.id)}, but they survived!<br>`;
                    winner.actionLog.push(`GR ${round}: Attacked ${createPlayerLink(loser.id)} during Lights Out, but they survived.`);
                } else {
                    creditElimination(winner.id, loser.id);
                    details += `${createPlayerLink(winner.id)} eliminated ${createPlayerLink(loser.id)} in the chaos.<br>`;
                    winner.actionLog.push(`GR ${round}: Eliminated ${createPlayerLink(loser.id)} during Lights Out.`);
                    loser.actionLog.push(`Event: Was eliminated by ${createPlayerLink(winner.id)} during Lights Out.`);
                    eliminatedThisRound.push(loser);
                    eliminatedIdsThisRound.add(loser.id);
                }
            }
        }
    });

    let unluckyPlayers = activePlayers.filter(p => !eliminatedIdsThisRound.has(p.id));
    unluckyPlayers.sort(() => 0.5 - Math.random());
    
    for(const player of unluckyPlayers) {
        const unluckyChance = 0.003 + (getEffectiveStat(player, 'cowardice') / 500);
        if (Math.random() < unluckyChance) {
                if (checkSurvivalMechanics(player, "Lights Out", true)) {
                details += `${createPlayerLink(player.id)} was in a bad spot but was protected.<br>`;
            } else {
                details += `${createPlayerLink(player.id)} was eliminated in a freak accident in the dark.<br>`;
                player.actionLog.push(`GR ${round}: Was eliminated by accident during Lights Out.`);
                eliminatedThisRound.push(player);
                eliminatedIdsThisRound.add(player.id);
            }
        }
    }
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`was eliminated in the chaos.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `was eliminated in the chaos.`, false, 'Lights Out', false, false, details, true);
    }
}


function handleHopscotch() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length === 0) {
        logEvent(`GR ${round} (Hopscotch): No players to participate.`);
        return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Hopscotch` });

    const eliminatedThisRound = [];
    let details = "Hopscotch Rolls:<br>";

    activePlayers.forEach(p => {
        const rolls = [];
        let total = 0;
        
        const rollDie = (player) => {
            let roll = Math.floor(Math.random() * 6) + 1;
            const luckFactor = (getEffectiveStat(player, 'luck') - 7.5) / 15;
            if (Math.random() < Math.abs(luckFactor)) {
                roll += Math.sign(luckFactor);
            }
            return Math.max(1, Math.min(6, Math.round(roll)));
        };

        for(let i=0; i<3; i++){
            rolls.push(rollDie(p));
        }
        total = rolls.reduce((a, b) => a + b, 0);

        let logMessage = `Rolled [${rolls.join(', ')}] for a total of ${total} in Hopscotch.`;
            details += `${createPlayerLink(p.id)}: [${rolls.join(', ')}] = <b>${total}</b>... `;
        
        if (total < 11) {
            logMessage += " FAILED.";
            if (checkSurvivalMechanics(p, "Hopscotch")) {
                details += "FAILED but was protected.<br>";
            } else {
                details += "FAILED.<br>";
                eliminatedThisRound.push(p);
                p.actionLog.push(`GR ${round}: ${logMessage}`);
            }
        } else {
            logMessage += " PASSED.";
            details += "PASSED.<br>";
            p.actionLog.push(`GR ${round}: ${logMessage}`);
        }
    });
    eliminatedThisRound.sort(() => Math.random() - 0.5);
    
    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`failed Hopscotch.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `failed Hopscotch.`, false, 'Hopscotch', false, false, details);
    }
}

function handleHideAndSeek() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Hide and Seek): Not enough players.`);
        return;
    }
    
    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Hide & Seek` });

    let shuffled = [...activePlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const midPoint = Math.ceil(shuffled.length / 2);
    const seekers = shuffled.slice(0, midPoint); 
    let hiders = shuffled.slice(midPoint); 
    
    seekers.forEach(p => p.actionLog.push(`GR ${round}: Was a Seeker in Hide and Seek.`));
    hiders.forEach(p => p.actionLog.push(`GR ${round}: Was a Hider in Hide and Seek.`));
    
    let details = `<b>Seekers:</b> ${seekers.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}<br><b>Hiders:</b> ${hiders.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}<hr>`;
    
    let foundHiders = new Set();
    let eliminatedThisRound = [];
    let seekerSuccess = {};

    seekers.forEach(seeker => {
        seekerSuccess[seeker.id] = 0;
        let maxFinds = 1;

        if (getEffectiveStat(seeker, 'greed') > 10 && Math.random() < 0.15) {
            maxFinds = 2;
            if(getEffectiveStat(seeker, 'greed') > 13 && Math.random() < 0.1) maxFinds = 3;
        }

        for(let i=0; i < maxFinds; i++) {
            let availableHiders = hiders.filter(h => !foundHiders.has(h.id) && !eliminatedThisRound.some(e => e.id === h.id));
            if (availableHiders.length === 0) break;
            
            let target = availableHiders[Math.floor(Math.random() * availableHiders.length)];

            let findChance = 0.75;
            findChance += (getEffectiveStat(seeker, 'intelligence') - getEffectiveStat(target, 'intelligence')) / 50;
            findChance += (getEffectiveStat(seeker, 'strength') - getEffectiveStat(target, 'agility')) / 50;
            findChance += (getEffectiveStat(seeker, 'luck') - 5) / 100;
            
            if (Math.random() < findChance) {
                foundHiders.add(target.id);
                details += `P${formatPlayerNumber(seeker.id)} found P${formatPlayerNumber(target.id)}. `;
                
                if (Math.random() < 0.05 && getEffectiveStat(target, 'strength') > 10) {
                    if (!checkSurvivalMechanics(seeker, "Hide and Seek (retaliation)", true)) {
                        eliminatedThisRound.push(seeker);
                        target.actionLog.push(`GR ${round}: Found by P${formatPlayerNumber(seeker.id)} but was able to fight him off thus eliminating him.`);
                        seeker.actionLog.push(`GR ${round}: Was eliminated after finding and fighting P${formatPlayerNumber(target.id)}.`);
                        details += `But P${formatPlayerNumber(target.id)} fought back and eliminated seeker P${formatPlayerNumber(seeker.id)}!<br>`;
                        creditElimination(target.id, seeker.id);
                    }
                } else { 
                    seekerSuccess[seeker.id]++;
                    seeker.actionLog.push(`GR ${round}: Found P${formatPlayerNumber(target.id)}.`);
                    target.actionLog.push(`GR ${round}: Was found by P${formatPlayerNumber(seeker.id)}.`);

                    if (!checkSurvivalMechanics(target, "Hide & Seek")) {
                        eliminatedThisRound.push(target);
                        details += `P${formatPlayerNumber(target.id)} was eliminated.<br>`;
                    } else {
                            details += `P${formatPlayerNumber(target.id)} was protected.<br>`;
                    }
                }
            }
        }
    });

    seekers.forEach(seeker => {
        if (seekerSuccess[seeker.id] === 0 && !eliminatedThisRound.some(e => e.id === seeker.id)) {
            if (!checkSurvivalMechanics(seeker, "Hide & Seek")) {
                eliminatedThisRound.push(seeker);
                details += `Seeker P${formatPlayerNumber(seeker.id)} failed to find anyone and was eliminated.<br>`;
                seeker.actionLog.push(`GR ${round}: Failed to find anyone as a Seeker and was eliminated.`);
            }
        }
    });

    const minElims = Math.floor(activePlayers.length * 0.5);
    const maxElims = Math.ceil(activePlayers.length * 0.6);
    
    let uniqueEliminated = [...new Set(eliminatedThisRound)];
    
    let availableHidersToElim = hiders.filter(h => !uniqueEliminated.some(e => e.id === h.id) && !foundHiders.has(h.id));
    while(uniqueEliminated.length < minElims && availableHidersToElim.length > 0) {
        let unluckyHider = availableHidersToElim.pop();
        if (!checkSurvivalMechanics(unluckyHider, "Hide & Seek")) {
            uniqueEliminated.push(unluckyHider);
            details += `P${formatPlayerNumber(unluckyHider.id)} was found under duress and eliminated.<br>`;
            unluckyHider.actionLog.push(`GR ${round}: Was found and eliminated to meet a quota.`);
        }
    }
    
    while(uniqueEliminated.length > maxElims) {
        let luckyPlayer = uniqueEliminated.pop();
        details += `P${formatPlayerNumber(luckyPlayer.id)} was spared at the last second.<br>`;
        const logIndex = luckyPlayer.actionLog.length - 1;
        luckyPlayer.actionLog[logIndex] = luckyPlayer.actionLog[logIndex].replace('and was eliminated', 'but was spared').replace('and eliminated', 'but spared');
    }
    eliminatedThisRound = uniqueEliminated;
    
    const survivors = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));
    survivors.forEach(s => {
            if (!s.actionLog.some(log => log.includes(`GR ${round}:`))) {
                s.actionLog.push(`GR ${round}: Survived Hide and Seek.`);
            }
    });

    if (animationModeEnabled) {
            toggleAnimationMode();
            playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
            animatedEliminationIndex = 0;
            processNextAnimatedElimination(`failed Hide and Seek.`);
    } else {
        handleEliminationProcessing(eliminatedThisRound, `failed Hide and Seek.`, false, 'Hide & Seek', false, false, details);
    }
}


function handleSkySquidGame() {
    if (!preRoundUpdate()) return;
    let activePlayers = getActivePlayers();
    if (activePlayers.length < 2) {
        logEvent(`GR ${round} (Sky Squid Game): Not enough players.`);
        return;
    }

    eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Sky Squid Game` });

    let numToEliminate;
    if (activePlayers.length <= 3) {
        numToEliminate = activePlayers.length - 1;
    } else if (activePlayers.length <= 9) {
        const minElims = 3;
        const maxElims = activePlayers.length - 1;
        numToEliminate = Math.floor(Math.random() * (maxElims - minElims + 1)) + minElims;
    } else {
        numToEliminate = Math.floor(Math.random() * 7) + 3;
    }

    if(numToEliminate <= 0) {
            logEvent(`GR ${round} (Sky Squid Game): No one was eliminated.`);
            return;
    }

    activePlayers.forEach(p => {
        let risk = 0;
        risk += (15 - getEffectiveStat(p, 'charisma'));
        risk += (15 - getEffectiveStat(p, 'strength'));
        risk += (15 - getEffectiveStat(p, 'agility'));
        risk += (15 - getEffectiveStat(p, 'luck'));
        risk += getEffectiveStat(p, 'cowardice') * 2;
        p.eliminationRisk = risk + Math.random();
    });

    let sortedForElim = [...activePlayers].sort((a,b) => b.eliminationRisk - a.eliminationRisk);
    
    const eliminatedThisRound = [];
    let toEliminate = sortedForElim.slice(0, numToEliminate);

    toEliminate.forEach(p => {
            if (!checkSurvivalMechanics(p, "Sky Squid Game")) {
            eliminatedThisRound.push(p);
        }
    });

    let details = "Elimination Details:<br>";
    const survivors = activePlayers.filter(p => !eliminatedThisRound.some(e => e.id === p.id));
    
    eliminatedThisRound.forEach(eliminatedPlayer => {
        let pusher = null;
        let potentialPushers = survivors.filter(p => p.id !== eliminatedPlayer.id);

        if (potentialPushers.length > 0) {
                const enemies = potentialPushers.filter(s => s.enemies.includes(eliminatedPlayer.id));
                if(enemies.length > 0 && Math.random() < 0.75) {
                    pusher = enemies[Math.floor(Math.random() * enemies.length)];
                } else {
                    pusher = potentialPushers[Math.floor(Math.random() * potentialPushers.length)];
                }
            }

            if (pusher) {
                    creditElimination(pusher.id, eliminatedPlayer.id);
                    details += `P${formatPlayerNumber(pusher.id)} pushed P${formatPlayerNumber(eliminatedPlayer.id)} off the platform.<br>`;
                    eliminatedPlayer.actionLog.push(`GR ${round}: Failed Sky Squid Game (pushed by P${formatPlayerNumber(pusher.id)}).`);
                    pusher.actionLog.push(`GR ${round}: Pushed P${formatPlayerNumber(eliminatedPlayer.id)} during Sky Squid Game.`);
            } else {
                    details += `P${formatPlayerNumber(eliminatedPlayer.id)} fell off the platform.<br>`;
                    eliminatedPlayer.actionLog.push(`GR ${round}: Failed Sky Squid Game (fell).`);
            }
        });
        
        survivors.forEach(s => {
            if (!s.actionLog.some(log => log.includes(`GR ${round}:`))) {
                    s.actionLog.push(`GR ${round}: Passed Sky Squid Game.`);
                }
        });
        
            if (animationModeEnabled) {
                toggleAnimationMode();
                playersToEliminateInAnimation = eliminatedThisRound.map(p => p.id);
                animatedEliminationIndex = 0;
                processNextAnimatedElimination(`fell in Sky Squid Game.`);
        } else {
            handleEliminationProcessing(eliminatedThisRound, `fell in Sky Squid Game.`, false, 'Sky Squid Game', false, false, details);
        }
    }

    function handleMingle() {
        if (!preRoundUpdate()) return;
        let activePlayers = getActivePlayers();
        if (activePlayers.length === 0) {
            logEvent(`GR ${round} (Mingle): No players.`);
            return;
        }
        
        eliminationOrder.push({ isHeader: true, round: round, text: `GR ${round}: Mingle` });
        
        let eliminatedInOrder = [];
        let details = "Mingle Rounds:<br>";
        
        const mingleSubRounds = [
            { name: 'first', elimChance: 0.15 }, { name: 'second', elimChance: 0.15 },
            { name: 'third', elimChance: 0.15 }, { name: 'fourth', elimChance: 0.15 }, { name: 'fifth', elimChance: 0.15 }
        ];

        let playersInGame = [...activePlayers];

        for (const subRound of mingleSubRounds) {
            if (playersInGame.length < 2) break;
            
            let failedThisSubRound = [];
            let stillInMingle = [];
            
            playersInGame.forEach(player => {
                let failChance = subRound.elimChance;
                failChance -= (getEffectiveStat(player, 'charisma') + getEffectiveStat(player, 'luck') - getEffectiveStat(player, 'cowardice')) / 150;
                failChance = Math.max(0.01, failChance);
                
                if (Math.random() < failChance) {
                    if (checkSurvivalMechanics(player, "Mingle")) {
                        stillInMingle.push(player);
                    } else {
                        failedThisSubRound.push(player);
                    }
                } else {
                    stillInMingle.push(player);
                }
            });

            if (failedThisSubRound.length > 0) {
                details += `Eliminated in ${subRound.name} round: ${failedThisSubRound.map(p => `P${formatPlayerNumber(p.id)}`).join(', ')}<br>`;
                failedThisSubRound.forEach(p => {
                    p.actionLog.push(`GR ${round}: Failed Mingle in the ${subRound.name} round.`);
                    eliminatedInOrder.push(p);
                });
            }
            playersInGame = stillInMingle;
        }

        playersInGame.forEach(p => p.actionLog.push(`GR ${round}: Passed Mingle.`));
        
        if (animationModeEnabled) {
                toggleAnimationMode();
                playersToEliminateInAnimation = eliminatedInOrder.map(p => p.id);
                animatedEliminationIndex = 0;
                processNextAnimatedElimination(`failed to find a partner.`);
        } else {
            handleEliminationProcessing(eliminatedInOrder, `failed to find a partner.`, false, 'Mingle', false, false, details);
        }
    }

function handleRandomEvent() {
    if (isViewingArchivedGame) return;
    const availableEventHandlers = [
        { name: 'bathroomFight', handler: handleBathroomFight },
        { name: 'xVsO', handler: handleXvsO },
        { name: 'escapeAttempt', handler: handleEscapeAttempt },
        { name: 'giveHint', handler: handleGiveHint },
        { name: 'selfElimination', handler: handleRandomSelfElimination }
    ].filter(event => !usedEvents.has(event.name));

    if (availableEventHandlers.length === 0) {
        alert("No more unique events available for this game.");
        return;
    }

    const randomEvent = availableEventHandlers[Math.floor(Math.random() * availableEventHandlers.length)];
    randomEvent.handler();
}

function handleEvent(eventName, handlerFunction) {
    if (isViewingArchivedGame) return false;
    if (isViewingHistory) { alert("Cannot perform actions while viewing history. return;"); return false;}
    if (usedEvents.has(eventName)) { alert(`The '${eventName}' event has already occurred this game.`); return false; }
    return handlerFunction(); 
}

function handleBathroomFight() {
    return handleEvent('bathroomFight', () => {
        if (!season2ModeActive) { alert("This event requires Season 2 Voting to be active."); return false; }

        const activePlayers = getActivePlayers();
        const xVoters = activePlayers.filter(p => p.currentVote === 'X');
        const oVoters = activePlayers.filter(p => p.currentVote === 'O');

        if (xVoters.length < 2 || oVoters.length < 2) {
            alert("Not enough X and O voters for a bathroom fight (need at least 2 of each).");
            return false;
        }

        xVoters.sort(() => 0.5 - Math.random());
        oVoters.sort(() => 0.5 - Math.random());
        
        const numToTake = Math.min(xVoters.length, oVoters.length, Math.floor((Math.random() * 6) + 5));
        const participantsX = xVoters.slice(0, numToTake);
        const participantsO = oVoters.slice(0, numToTake);
        const allParticipants = [...participantsX, ...participantsO];
        
        let details = `The fight involved:<br><b>X-Voters:</b> ${participantsX.map(p => createPlayerLink(p.id)).join(', ')}<br><b>O-Voters:</b> ${participantsO.map(p => createPlayerLink(p.id)).join(', ')}<hr>`;
        allParticipants.forEach(p => p.actionLog.push("Event: Participated in the Bathroom Fight."));

        let eliminatedThisEvent = [];
        let maxElims = Math.floor(allParticipants.length * 0.6);

        for (let i = 0; i < allParticipants.length / 2; i++) {
            if (eliminatedThisEvent.length >= maxElims) break;

            const fighters = [...participantsX, ...participantsO].filter(p => !eliminatedThisEvent.includes(p));
            if (fighters.length < 2) break;
            
            const p1 = fighters.find(p => p.currentVote === 'X');
            const p2 = fighters.find(p => p.currentVote === 'O');
            if (!p1 || !p2) continue;

            if (p1.allies.includes(p2.id)) continue;

            const p1Score = getEffectiveStat(p1, 'strength') + getEffectiveStat(p1, 'agility') + Math.random() * 5;
            const p2Score = getEffectiveStat(p2, 'strength') + getEffectiveStat(p2, 'agility') + Math.random() * 5;
            
            const [winner, loser] = p1Score > p2Score ? [p1,p2] : [p2,p1];
            
            if (!checkSurvivalMechanics(loser, "the Bathroom Fight", true)) {
                creditElimination(winner.id, loser.id);
                eliminatedThisEvent.push(loser);
                details += `${createPlayerLink(winner.id)} eliminated ${createPlayerLink(loser.id)}.<br>`;
                winner.actionLog.push(`Event: Eliminated ${createPlayerLink(loser.id)} in the Bathroom Fight.`);
                loser.actionLog.push(`Event: Was eliminated by ${createPlayerLink(winner.id)} in the Bathroom Fight.`);
            }
        }
        
        const survivors = allParticipants.filter(p => !eliminatedThisEvent.includes(p));
        survivors.forEach(p => p.actionLog.push("Event: Survived the Bathroom Fight."));

        let injuredCount = 0;
        let maxInjuries = Math.floor(survivors.length * 0.6);
        survivors.forEach(survivor => {
            if (injuredCount < maxInjuries && Math.random() < 0.6 && !survivor.injury) {
                manualInjury(survivor.id, false, true); 
                survivor.actionLog.push("Event: Was injured in the Bathroom Fight.");
                injuredCount++;
            }
        });

        usedEvents.add('bathroomFight');
        updateEventButtons();
        handleEliminationProcessing(eliminatedThisEvent, "was eliminated in the Bathroom Fight", false, "Event: Bathroom Fight", false, false, details, true);
        return true;
    });
}

    function handleXvsO() {
    return handleEvent('xVsO', () => {
        if (!season2ModeActive) { alert("This event requires Season 2 Voting to be active."); return false; }

        const activePlayers = getActivePlayers();
        const xVoters = activePlayers.filter(p => p.currentVote === 'X');
        const oVoters = activePlayers.filter(p => p.currentVote === 'O');

        if (xVoters.length < 1 || oVoters.length < 1) {
            alert("Not enough X and O voters for a brawl (need at least 1 of each).");
            return false;
        }

        let eliminatedThisEvent = [];
        let details = "Events in the X vs O brawl:<br";

</update>
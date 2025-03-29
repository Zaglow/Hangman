let gameMode = "";
let players = [];
let currentPlayerIndex = 0;
let selectedWord = "";
let hint = "";
let guessedLetters = [];
let incorrectGuesses = 0;
let isArabic = false;
let startTime = 0;
let score = 0;
let timerInterval = null;
let playersFinished = 0;
let soundEnabled = true;
let musicEnabled = true;
let darkMode = false;
let audioInitialized = false;

const clickSound = new Audio("sounds/click.mp3");
const gameoverSound = new Audio("sounds/gameover.mp3");
const themeMusic = new Audio("sounds/theme.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");
const winSound = new Audio("sounds/win.mp3");

themeMusic.loop = true;
themeMusic.volume = 0.25;

const canvas = document.getElementById("hangman-canvas");
const ctx = canvas.getContext("2d");
const mainMenu = document.getElementById("main-menu");
const languageSelect = document.getElementById("language-select");
const soloGameArea = document.getElementById("solo-game-area");
const partySetup = document.getElementById("party-setup");
const onlineSetup = document.getElementById("online-setup");
const secretInputPhase = document.getElementById("secret-input-phase");
const wordDisplay = document.getElementById("word-display");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");
const hintDisplay = document.getElementById("hint-display");
const timer = document.getElementById("timer");
const currentPlayerName = document.getElementById("current-player-name");
const currentPlayerDisplay = document.getElementById("current-player");
const scorePopup = document.getElementById("score-popup");
const readyPopup = document.getElementById("ready-popup");
const leaderboard = document.getElementById("leaderboard");
const soundToggle = document.getElementById("sound-toggle");
const musicToggle = document.getElementById("music-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const fixedHeader = document.getElementById("fixed-header");
const fixedTimer = document.getElementById("fixed-timer");
const fixedWordDisplay = document.getElementById("fixed-word-display");
const wordTimerContainer = document.getElementById("word-timer-container");

function initializeAudio() {
    if (!audioInitialized) {
        clickSound.load();
        gameoverSound.load();
        wrongSound.load();
        winSound.load();
        themeMusic.load();
        if (musicEnabled) {
            themeMusic.play().then(() => console.log("Theme music started")).catch(err => console.error("Theme music failed:", err));
        }
        audioInitialized = true;
    }
}

function playSound(sound) {
    if (soundEnabled && audioInitialized) {
        sound.currentTime = 0;
        sound.play().then(() => console.log(`Playing: ${sound.src.split('/').pop()}`)).catch(err => console.error(`Failed: ${sound.src.split('/').pop()}`, err));
    }
}

soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
    initializeAudio();
    playSound(clickSound);
});

musicToggle.addEventListener("click", () => {
    musicEnabled = !musicEnabled;
    musicToggle.textContent = musicEnabled ? "🎵" : "🔇";
    initializeAudio();
    if (musicEnabled) {
        themeMusic.play().then(() => console.log("Theme resumed")).catch(err => console.error("Theme failed:", err));
    } else {
        themeMusic.pause();
    }
    playSound(clickSound);
});

darkModeToggle.addEventListener("click", () => {
    darkMode = !darkMode;
    document.body.classList.toggle("dark-mode", darkMode);
    document.querySelector(".container").classList.toggle("dark-mode", darkMode);
    darkModeToggle.textContent = darkMode ? "☀️" : "🌙";
    initializeAudio();
    playSound(clickSound);
});

function drawBase() {
    ctx.lineWidth = 3;
    ctx.strokeStyle = darkMode ? "#66b3ff" : "#0288d1";
    ctx.beginPath();
    ctx.moveTo(20, 330); ctx.lineTo(260, 330);
    ctx.moveTo(70, 330); ctx.lineTo(70, 40);
    ctx.lineTo(180, 40); ctx.lineTo(180, 70);
    ctx.stroke();
}
function drawHead() { ctx.beginPath(); ctx.arc(180, 100, 30, 0, Math.PI * 2); ctx.stroke(); }
function drawBody() { ctx.moveTo(180, 130); ctx.lineTo(180, 200); ctx.stroke(); }
function drawLeftArm() { ctx.moveTo(180, 150); ctx.lineTo(150, 180); ctx.stroke(); }
function drawRightArm() { ctx.moveTo(180, 150); ctx.lineTo(210, 180); ctx.stroke(); }
function drawLeftLeg() { ctx.moveTo(180, 200); ctx.lineTo(150, 250); ctx.stroke(); }
function drawRightLeg() { ctx.moveTo(180, 200); ctx.lineTo(210, 250); ctx.stroke(); }
function drawHangman() {
    const parts = [drawHead, drawBody, drawLeftArm, drawRightArm, drawLeftLeg, drawRightLeg];
    if (incorrectGuesses <= parts.length) {
        ctx.beginPath();
        parts[incorrectGuesses - 1]();
        ctx.stroke();
    }
}

function displayWord() {
    const wordArray = selectedWord.split("");
    const display = wordArray
        .map(letter => (guessedLetters.includes(letter) || letter === " " ? letter : "_"))
        .join(" ");
    wordDisplay.textContent = display.toUpperCase();
    fixedWordDisplay.textContent = display.toUpperCase(); // Sync fixed word display
    if (isArabic) {
        wordDisplay.classList.add("rtl");
        fixedWordDisplay.classList.add("rtl");
    } else {
        wordDisplay.classList.remove("rtl");
        fixedWordDisplay.classList.remove("rtl");
    }
    if (!display.includes("_")) endGame(true);
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter)) return;
    guessedLetters.push(letter);
    if (selectedWord.includes(letter)) {
        playSound(clickSound);
        displayWord();
    } else {
        playSound(wrongSound);
        incorrectGuesses++;
        drawHangman();
        const button = document.querySelector(`button[data-letter="${letter}"]`);
        if (button) button.classList.add("incorrect-letter");
        if (incorrectGuesses >= 6) endGame(false);
    }
}

function createKeyboard() {
    keyboard.innerHTML = "";
    const englishAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    const arabicAlphabet = "ابتثجحخدذرزسشصضطظعغفقكلمنهوىةأإءي0123456789".split("");
    const alphabet = isArabic ? arabicAlphabet : englishAlphabet;
    alphabet.forEach(letter => {
        const button = document.createElement("button");
        button.textContent = letter;
        button.setAttribute("data-letter", letter);
        button.onclick = () => {
            playSound(clickSound);
            button.disabled = true;
            handleGuess(letter.toUpperCase());
        };
        keyboard.appendChild(button);
    });
}

function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `Time: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        timer.textContent = timeString;
        fixedTimer.textContent = timeString; // Sync fixed timer
    }, 1000);
}

function calculateScore() {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(1000 - (timeTaken * 10) - (incorrectGuesses * 50), 0);
}

function showScorePopup(won) {
    const score = calculateScore();
    const popupTitle = document.getElementById("popup-title");
    const popupScore = document.getElementById("popup-score");
    const popupStars = document.getElementById("popup-stars");
    
    if (won) {
        popupTitle.textContent = "Well Done! 🥳";
        popupScore.textContent = `Score: ${score}`;
        const stars = Math.ceil(score / 200);
        popupStars.textContent = "★".repeat(stars) + "☆".repeat(5 - stars);
        playSound(winSound);
    } else {
        popupTitle.textContent = "Game Over! ☠️";
        popupScore.textContent = `Word was: "${selectedWord}"`;
        popupStars.textContent = "";
        playSound(gameoverSound);
    }
    scorePopup.style.display = "block";
}

function endGame(won) {
    disableAllButtons();
    clearInterval(timerInterval);
    if (gameMode === "solo") {
        message.textContent = won ? "🎉 You Win!" : "😔 Game Over!";
        showScorePopup(won);
    } else {
        if (won) {
            message.textContent = `🎉 ${players[currentPlayerIndex].name} Wins!`;
            players[currentPlayerIndex].score += calculateScore();
        } else {
            message.textContent = `💀 Word was: "${selectedWord}"`;
        }
        showScorePopup(won);
        playersFinished++;
    }
}

function disableAllButtons() {
    document.querySelectorAll(".keyboard button").forEach(btn => btn.disabled = true);
}

function addPlayer(name) {
    players.push({ name, word: "", hint: "", score: 0, assignedWord: "", assignedHint: "" });
    updatePlayerList();
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

function updatePlayerList() {
    const playerList = document.getElementById("player-list");
    playerList.innerHTML = "";
    players.forEach((player, index) => {
        const p = document.createElement("p");
        p.innerHTML = `${player.name} <button class="remove-player-btn" data-index="${index}">X</button>`;
        playerList.appendChild(p);
    });
    document.querySelectorAll(".remove-player-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            playSound(clickSound);
            removePlayer(parseInt(btn.getAttribute("data-index")));
        });
    });
}

function assignWords() {
    for (let i = 0; i < players.length; i++) {
        const nextPlayerIndex = (i + 1) % players.length;
        players[i].assignedWord = players[nextPlayerIndex].word;
        players[i].assignedHint = players[nextPlayerIndex].hint;
    }
}

function startPartyGame() {
    if (players.length < 2) {
        playSound(wrongSound);
        return alert("Need at least 2 players!");
    }
    partySetup.style.display = "none";
    secretInputPhase.style.display = "block";
    currentPlayerIndex = 0;
    playersFinished = 0;
    promptSecretInput();
}

function promptSecretInput() {
    if (currentPlayerIndex >= players.length) {
        secretInputPhase.style.display = "none";
        assignWords();
        currentPlayerIndex = 0; // Start with first player
        showReadyPopup();
        return;
    }
    currentPlayerName.textContent = `${players[currentPlayerIndex].name}'s Turn`;
    document.getElementById("secret-word").value = "";
    document.getElementById("secret-hint").value = "";
}

function showReadyPopup() {
    soloGameArea.style.display = "block";
    document.getElementById("ready-message").textContent = `${players[currentPlayerIndex].name}, Ready?`;
    readyPopup.style.display = "block";
}

function nextPlayer() {
    if (playersFinished >= players.length) {
        showLeaderboard();
        return;
    }
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    showReadyPopup();
}

function showLeaderboard() {
    soloGameArea.style.display = "none";
    leaderboard.style.display = "block";
    const table = document.getElementById("leaderboard-table");
    table.innerHTML = "<tr><th>Player</th><th>Score</th></tr>";
    players.sort((a, b) => b.score - a.score);
    const winner = players[0];
    players.forEach(p => {
        const row = document.createElement("tr");
        const nameCell = p === winner ? `<td class="winner">👑 ${p.name}</td>` : `<td>${p.name}</td>`;
        row.innerHTML = `${nameCell}<td>${p.score}</td>`;
        table.appendChild(row);
    });
}

function startSoloGame(language) {
    isArabic = language === "arabic";
    const englishWords = [
        { word: "PYTHON", hint: "Coding language" },
        { word: "GUITAR", hint: "Music maker" },
        { word: "PIZZA", hint: "Italian treat" },
        { word: "ROBOT", hint: "Smart machine" },
        { word: "GALAXY", hint: "Star system" }
    ];
    const arabicWords = [
        { word: "كتاب", hint: "للقراءة" },
        { word: "سيارة", hint: "وسيلة نقل" },
        { word: "تفاحة", hint: "فاكهة" },
        { word: "مدرسة", hint: "مكان التعلم" },
        { word: "شمس", hint: "تضيء النهار" }
    ];
    const words = isArabic ? arabicWords : englishWords;
    const random = words[Math.floor(Math.random() * words.length)];
    selectedWord = random.word;
    hint = random.hint;
    resetGame();
    startTimer();
}

function hostOnlineGame() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById("game-code").textContent = `Code: ${code}`;
    startPartyGame();
}

function joinOnlineGame(code) {
    alert(`Joining: ${code}`);
    startPartyGame();
}

function resetGame() {
    guessedLetters = [];
    incorrectGuesses = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBase();
    hintDisplay.textContent = `Hint: ${hint}`;
    displayWord();
    createKeyboard();
    message.textContent = "";
    timer.textContent = "";
    fixedTimer.textContent = "";
    currentPlayerDisplay.textContent = gameMode === "solo" ? "" : `${players[currentPlayerIndex].name}'s Turn`;
    document.getElementById("next-btn").style.display = "none";
}

function showMainMenu() {
    mainMenu.style.display = "flex";
    languageSelect.style.display = "none";
    soloGameArea.style.display = "none";
    partySetup.style.display = "none";
    onlineSetup.style.display = "none";
    secretInputPhase.style.display = "none";
    scorePopup.style.display = "none";
    readyPopup.style.display = "none";
    leaderboard.style.display = "none";
    currentPlayerDisplay.textContent = "";
    document.getElementById("start-party-btn").style.display = "block";
    document.getElementById("lets-go-btn").style.display = "none";
    fixedHeader.style.display = "none"; // Ensure fixed header is hidden on menu
}

function showPartySetup() {
    mainMenu.style.display = "none";
    partySetup.style.display = "block";
    updatePlayerList();
    document.getElementById("start-party-btn").style.display = "none";
    document.getElementById("lets-go-btn").style.display = "block";
}

document.getElementById("solo-btn").addEventListener("click", () => {
    playSound(clickSound);
    gameMode = "solo";
    mainMenu.style.display = "none";
    languageSelect.style.display = "block";
    initializeAudio();
});

document.getElementById("english-btn").addEventListener("click", () => {
    playSound(clickSound);
    languageSelect.style.display = "none";
    soloGameArea.style.display = "block";
    startSoloGame("english");
});

document.getElementById("arabic-btn").addEventListener("click", () => {
    playSound(clickSound);
    languageSelect.style.display = "none";
    soloGameArea.style.display = "block";
    startSoloGame("arabic");
});

document.getElementById("party-btn").addEventListener("click", () => {
    playSound(clickSound);
    gameMode = "party";
    mainMenu.style.display = "none";
    partySetup.style.display = "block";
    initializeAudio();
});

document.getElementById("online-btn").addEventListener("click", () => {
    playSound(clickSound);
    gameMode = "online";
    mainMenu.style.display = "none";
    onlineSetup.style.display = "block";
    initializeAudio();
});

document.getElementById("add-player-btn").addEventListener("click", () => {
    playSound(clickSound);
    const nameInput = document.getElementById("new-player-name");
    const name = nameInput.value.trim();
    if (name) {
        addPlayer(name);
        nameInput.value = "";
    }
});

document.getElementById("start-party-btn").addEventListener("click", () => {
    playSound(clickSound);
    startPartyGame();
});

document.getElementById("lets-go-btn").addEventListener("click", () => {
    playSound(clickSound);
    if (players.length < 2) {
        playSound(wrongSound);
        return alert("Need at least 2 players!");
    }
    partySetup.style.display = "none";
    secretInputPhase.style.display = "block";
    currentPlayerIndex = 0;
    playersFinished = 0;
    players.forEach(p => { p.score = 0; p.word = ""; p.hint = ""; p.assignedWord = ""; p.assignedHint = ""; });
    promptSecretInput();
});

document.getElementById("submit-secret-btn").addEventListener("click", () => {
    playSound(clickSound);
    const word = document.getElementById("secret-word").value.trim().toUpperCase();
    const hint = document.getElementById("secret-hint").value.trim();
    if (word && hint) {
        players[currentPlayerIndex].word = word;
        players[currentPlayerIndex].hint = hint;
        currentPlayerIndex++;
        promptSecretInput();
    } else {
        alert("Enter a word and hint!");
    }
});

document.getElementById("close-popup").addEventListener("click", () => {
    playSound(clickSound);
    scorePopup.style.display = "none";
    if (gameMode === "solo") {
        document.getElementById("next-btn").style.display = "block";
    } else {
        nextPlayer();
    }
});

document.getElementById("ready-btn").addEventListener("click", () => {
    playSound(clickSound);
    readyPopup.style.display = "none";
    selectedWord = players[currentPlayerIndex].assignedWord;
    hint = players[currentPlayerIndex].assignedHint;
    isArabic = /[\u0600-\u06FF]/.test(selectedWord);
    resetGame();
    startTimer();
});

document.getElementById("next-btn").addEventListener("click", () => {
    playSound(clickSound);
    startSoloGame(isArabic ? "arabic" : "english");
});

document.getElementById("host-online-btn").addEventListener("click", () => {
    playSound(clickSound);
    hostOnlineGame();
});

document.getElementById("join-online-btn").addEventListener("click", () => {
    playSound(clickSound);
    const code = document.getElementById("join-code").value;
    if (code) joinOnlineGame(code);
});

document.getElementById("solo-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    showMainMenu();
});

document.getElementById("party-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    showMainMenu();
});

document.getElementById("online-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    showMainMenu();
});

document.getElementById("language-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    showMainMenu();
});

document.getElementById("leaderboard-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    showMainMenu();
});

document.getElementById("rematch-btn").addEventListener("click", () => {
    playSound(clickSound);
    leaderboard.style.display = "none";
    showPartySetup();
});

// Scroll listener to toggle fixed header
window.addEventListener("scroll", () => {
    const containerRect = document.querySelector(".container").getBoundingClientRect();
    const wordTimerRect = wordTimerContainer.getBoundingClientRect();
    if (wordTimerRect.bottom < containerRect.top + 40) { // When word-timer scrolls above container top
        fixedHeader.style.display = "flex";
    } else {
        fixedHeader.style.display = "none";
    }
});
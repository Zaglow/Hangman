// Game State
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

const canvas = document.getElementById("hangman-canvas");
const ctx = canvas.getContext("2d");

// DOM Elements
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

// Drawing Functions
function drawBase() {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 240); ctx.lineTo(190, 240);
    ctx.moveTo(50, 240); ctx.lineTo(50, 20);
    ctx.lineTo(120, 20); ctx.lineTo(120, 40);
    ctx.stroke();
}
function drawHead() { ctx.beginPath(); ctx.arc(120, 60, 20, 0, Math.PI * 2); ctx.stroke(); }
function drawBody() { ctx.beginPath(); ctx.moveTo(120, 80); ctx.lineTo(120, 140); ctx.stroke(); }
function drawLeftArm() { ctx.beginPath(); ctx.moveTo(120, 90); ctx.lineTo(100, 120); ctx.stroke(); }
function drawRightArm() { ctx.beginPath(); ctx.moveTo(120, 90); ctx.lineTo(140, 120); ctx.stroke(); }
function drawLeftLeg() { ctx.beginPath(); ctx.moveTo(120, 140); ctx.lineTo(100, 180); ctx.stroke(); }
function drawRightLeg() { ctx.beginPath(); ctx.moveTo(120, 140); ctx.lineTo(140, 180); ctx.stroke(); }
function drawHangman() {
    const parts = [drawHead, drawBody, drawLeftArm, drawRightArm, drawLeftLeg, drawRightLeg];
    if (incorrectGuesses <= parts.length) parts[incorrectGuesses - 1]();
}

// Word Display and Guess Handling
function displayWord() {
    const wordArray = selectedWord.split("");
    let display;
    if (isArabic) {
        display = wordArray
            .map(letter => (guessedLetters.includes(letter) || letter === " " ? letter : "_"))
            .join(" ");
    } else {
        display = wordArray
            .map(letter => (guessedLetters.includes(letter) || letter === " " ? letter : "_"))
            .join(" ");
    }
    wordDisplay.textContent = display.toUpperCase();
    if (isArabic) wordDisplay.classList.add("rtl");
    else wordDisplay.classList.remove("rtl");
    if (!display.includes("_")) endGame(true);
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter)) return;
    guessedLetters.push(letter);
    if (selectedWord.includes(letter)) {
        displayWord();
    } else {
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
            button.disabled = true;
            handleGuess(letter.toUpperCase());
        };
        keyboard.appendChild(button);
    });
}

// Timer and Scoring
function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timer.textContent = `Time: ${elapsed}s`;
    }, 1000);
}

function calculateScore() {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(1000 - (timeTaken * 10) - (incorrectGuesses * 50), 0);
}

function showScorePopup(score) {
    const stars = Math.ceil(score / 200);
    document.getElementById("popup-score").textContent = `Score: ${score}`;
    document.getElementById("popup-stars").textContent = "★".repeat(stars) + "☆".repeat(5 - stars);
    scorePopup.style.display = "block";
}

function endGame(won) {
    disableAllButtons();
    clearInterval(timerInterval);
    const score = calculateScore();
    if (gameMode === "solo") {
        message.textContent = won
            ? "🎉 Great job! You guessed it perfectly!"
            : "😊 Nice try! Better luck next time!";
        showScorePopup(score);
    } else {
        if (won) {
            message.textContent = `🎉 ${players[currentPlayerIndex].name} wins!`;
            players[currentPlayerIndex].score += score;
        } else {
            message.textContent = `💀 Game Over! Word: "${selectedWord}"`;
        }
        showScorePopup(score);
        playersFinished++;
    }
}

function disableAllButtons() {
    document.querySelectorAll(".keyboard button").forEach(btn => btn.disabled = true);
}

// Party Mode Logic
function addPlayer(name) {
    players.push({ name, word: "", hint: "", score: 0, assignedWord: "", assignedHint: "" });
    updatePlayerList();
}

function updatePlayerList() {
    const playerList = document.getElementById("player-list");
    playerList.innerHTML = players.map(p => `<p>${p.name}</p>`).join("");
}

function assignWords() {
    // Create a closed loop: 1 → 2 → 3 → 1 (etc.)
    for (let i = 0; i < players.length; i++) {
        const nextPlayerIndex = (i + 1) % players.length; // Next player in sequence
        players[i].assignedWord = players[nextPlayerIndex].word;
        players[i].assignedHint = players[nextPlayerIndex].hint;
    }
}

function startPartyGame() {
    if (players.length < 2) return alert("Add at least two players!");
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
        currentPlayerIndex = Math.floor(Math.random() * players.length);
        showReadyPopup();
        return;
    }
    currentPlayerName.textContent = `${players[currentPlayerIndex].name}, enter your word and hint:`;
    document.getElementById("secret-word").value = "";
    document.getElementById("secret-hint").value = "";
}

function showReadyPopup() {
    soloGameArea.style.display = "block";
    document.getElementById("ready-message").textContent = `Ready, ${players[currentPlayerIndex].name}?`;
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
    players.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${p.name}</td><td>${p.score}</td>`;
        table.appendChild(row);
    });
}

// Solo Mode Logic
function startSoloGame(language) {
    isArabic = language === "arabic";
    const englishWords = [
        { word: "PYTHON", hint: "A popular programming language" },
        { word: "GUITAR", hint: "A stringed musical instrument" },
        { word: "PIZZA", hint: "An Italian dish" },
        { word: "ROBOT", hint: "A programmable machine" },
        { word: "GALAXY", hint: "A system of stars" },
        { word: "12345", hint: "A simple sequence" },
        { word: "FOREST", hint: "A large area with trees" },
        { word: "OCEAN", hint: "A vast body of water" },
        { word: "CANDLE", hint: "A source of light" },
        { word: "BRIDGE", hint: "A structure over a river" }
    ];
    const arabicWords = [
        { word: "كتاب", hint: "شيء تقرأه" },
        { word: "سيارة", hint: "وسيلة نقل" },
        { word: "تفاحة", hint: "فاكهة حمراء" },
        { word: "مدرسة", hint: "مكان للتعلم" },
        { word: "123", hint: "رقم بسيط" },
        { word: "جبل", hint: "ارتفاع طبيعي" },
        { word: "بحر", hint: "مسطح مائي كبير" },
        { word: "شمس", hint: "نجم يضيء النهار" },
        { word: "قمر", hint: "يضيء الليل" },
        { word: "شجرة", hint: "نبات طويل" }
    ];
    const words = isArabic ? arabicWords : englishWords;
    const random = words[Math.floor(Math.random() * words.length)];
    selectedWord = random.word;
    hint = random.hint;
    resetGame();
}

// Online Mode (Simulated)
function hostOnlineGame() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById("game-code").textContent = `Game Code: ${code}`;
    startPartyGame();
}

function joinOnlineGame(code) {
    alert(`Joining game with code: ${code}`);
    startPartyGame();
}

// Reset Game State
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
    document.getElementById("next-btn").style.display = "none";
    if (gameMode === "solo") startTimer();
}

// Navigation
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
    players = [];
    currentPlayerIndex = 0;
    playersFinished = 0;
}

// Event Listeners
document.getElementById("solo-btn").addEventListener("click", () => {
    gameMode = "solo";
    mainMenu.style.display = "none";
    languageSelect.style.display = "block";
});

document.getElementById("english-btn").addEventListener("click", () => {
    languageSelect.style.display = "none";
    soloGameArea.style.display = "block";
    startSoloGame("english");
});

document.getElementById("arabic-btn").addEventListener("click", () => {
    languageSelect.style.display = "none";
    soloGameArea.style.display = "block";
    startSoloGame("arabic");
});

document.getElementById("party-btn").addEventListener("click", () => {
    gameMode = "party";
    mainMenu.style.display = "none";
    partySetup.style.display = "block";
});

document.getElementById("online-btn").addEventListener("click", () => {
    gameMode = "online";
    mainMenu.style.display = "none";
    onlineSetup.style.display = "block";
});

document.getElementById("add-player-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("new-player-name");
    const name = nameInput.value.trim();
    if (name) {
        addPlayer(name);
        nameInput.value = "";
    }
});

document.getElementById("start-party-btn").addEventListener("click", startPartyGame);

document.getElementById("submit-secret-btn").addEventListener("click", () => {
    const word = document.getElementById("secret-word").value.trim().toUpperCase();
    const hint = document.getElementById("secret-hint").value.trim();
    if (word && hint) {
        players[currentPlayerIndex].word = word;
        players[currentPlayerIndex].hint = hint;
        currentPlayerIndex++;
        promptSecretInput();
    } else {
        alert("Please enter both a word and a hint!");
    }
});

document.getElementById("close-popup").addEventListener("click", () => {
    scorePopup.style.display = "none";
    if (gameMode === "solo") {
        document.getElementById("next-btn").style.display = "block";
    } else {
        nextPlayer();
    }
});

document.getElementById("ready-btn").addEventListener("click", () => {
    readyPopup.style.display = "none";
    selectedWord = players[currentPlayerIndex].assignedWord;
    hint = players[currentPlayerIndex].assignedHint;
    isArabic = /[\u0600-\u06FF]/.test(selectedWord);
    currentPlayerDisplay.textContent = `${players[currentPlayerIndex].name} start!`;
    resetGame();
    startTimer();
});

document.getElementById("next-btn").addEventListener("click", () => {
    startSoloGame(isArabic ? "arabic" : "english");
});

document.getElementById("host-online-btn").addEventListener("click", hostOnlineGame);
document.getElementById("join-online-btn").addEventListener("click", () => {
    const code = document.getElementById("join-code").value;
    if (code) joinOnlineGame(code);
});

document.getElementById("solo-back-btn").addEventListener("click", showMainMenu);
document.getElementById("party-back-btn").addEventListener("click", showMainMenu);
document.getElementById("online-back-btn").addEventListener("click", showMainMenu);
document.getElementById("language-back-btn").addEventListener("click", showMainMenu);
document.getElementById("leaderboard-back-btn").addEventListener("click", showMainMenu);

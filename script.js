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
let currentDifficulty = "";
let completedWords = { easy: [], medium: [], hard: [] };
let englishWords = { easy: [], medium: [], hard: [] };
let arabicWords = { easy: [], medium: [], hard: [] };

const SHEET_ID = "1CjUyE0-xAZPHWfW45ZJDeVL39pCJh04UMjUYsiTehcI";
const API_KEY = "AIzaSyAOhPA_aKNVrtbdBWnOrd1AuryFUJ3cBuw";
const MAX_GUESSES = 6; // Six chances (hearts)

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
const difficultySelect = document.getElementById("difficulty-select");
const wordListArea = document.getElementById("word-list-area");
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
const heartsPopup = document.getElementById("hearts-popup");
const leaderboard = document.getElementById("leaderboard");
const soundToggle = document.getElementById("sound-toggle");
const musicToggle = document.getElementById("music-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const languageToggle = document.getElementById("language-toggle");
const fixedHeader = document.getElementById("fixed-header");
const fixedTimer = document.getElementById("fixed-timer");
const fixedWordDisplay = document.getElementById("fixed-word-display");
const wordTimerContainer = document.getElementById("word-timer-container");
const heartsDisplay = document.getElementById("hearts");

// UI Translations
const translations = {
    en: {
        "Solo 🎮": "Solo 🎮",
        "Party 🥳": "Party 🥳",
        "Online 🌐": "Online 🌐",
        "Pick a Language": "Pick a Language",
        "English": "English",
        "عربي": "Arabic",
        "Back": "Back",
        "Choose Difficulty": "Choose Difficulty",
        "Easy": "Easy",
        "Medium": "Medium",
        "Hard": "Hard",
        "Word List": "Word List",
        "Start Random Word": "Start Random Word",
        "Party Mode": "Party Mode",
        "Player name": "Player name",
        "Start": "Start",
        "Let's Go!": "Let's Go!",
        "Online Party": "Online Party",
        "Host Game": "Host Game",
        "Game Code": "Game Code",
        "Join": "Join",
        "Well done!": "Well done!",
        "Game Over!": "Game Over!",
        "OK": "OK",
        "Leaderboard": "Leaderboard",
        "Player": "Player",
        "Score": "Score",
        "Rematch": "Rematch",
        "Next Word": "Next Word",
        "Hint: ": "Hint: ",
        "Submit": "Submit"
    },
    ar: {
        "Solo 🎮": "فردي 🎮",
        "Party 🥳": "جماعي 🥳",
        "Online 🌐": "عبر الإنترنت 🌐",
        "Pick a Language": "اختر لغة",
        "English": "إنجليزي",
        "عربي": "عربي",
        "Back": "رجوع",
        "Choose Difficulty": "اختر الصعوبة",
        "Easy": "سهل",
        "Medium": "متوسط",
        "Hard": "صعب",
        "Word List": "قائمة الكلمات",
        "Start Random Word": "ابدأ كلمة عشوائية",
        "Party Mode": "وضع الجماعة",
        "Player name": "اسم اللاعب",
        "Start": "ابدأ",
        "Let's Go!": "هيا بنا!",
        "Online Party": "جماعي عبر الإنترنت",
        "Host Game": "استضف لعبة",
        "Game Code": "كود اللعبة",
        "Join": "انضم",
        "Well done!": "أحسنت!",
        "Game Over!": "انتهت اللعبة!",
        "OK": "موافق",
        "Leaderboard": "لوحة المتصدرين",
        "Player": "لاعب",
        "Score": "نقاط",
        "Rematch": "إعادة مباراة",
        "Next Word": "الكلمة التالية",
        "Hint: ": "تلميح: ",
        "Submit": "إرسال"
    }
};

async function fetchWords() {
    const sheets = {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        "سهل": "سهل",
        "متوسط": "متوسط",
        "صعب": "صعب"
    };
    for (let difficulty in sheets) {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheets[difficulty]}!A:B?key=${API_KEY}`
            );
            const data = await response.json();
            if (data.values) {
                const wordList = data.values.map(row => ({ word: row[0], hint: row[1] }));
                if (["easy", "medium", "hard"].includes(difficulty)) {
                    englishWords[difficulty] = wordList;
                } else {
                    arabicWords[difficulty === "سهل" ? "easy" : difficulty === "متوسط" ? "medium" : "hard"] = wordList;
                }
            } else {
                console.error(`No data found for ${sheets[difficulty]}`);
            }
        } catch (error) {
            console.error(`Error fetching ${sheets[difficulty]}:`, error);
        }
    }
}

function initializeAudio() {
    if (!audioInitialized) {
        clickSound.load();
        gameoverSound.load();
        wrongSound.load();
        winSound.load();
        themeMusic.load();
        if (musicEnabled) themeMusic.play().catch(err => console.error("Theme music failed:", err));
        audioInitialized = true;
    }
}

function playSound(sound) {
    if (soundEnabled && audioInitialized) {
        sound.currentTime = 0;
        sound.play().catch(err => console.error(`Failed: ${sound.src.split('/').pop()}`, err));
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
    if (musicEnabled) themeMusic.play().catch(err => console.error("Theme failed:", err));
    else themeMusic.pause();
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

languageToggle.addEventListener("click", () => {
    isArabic = !isArabic;
    languageToggle.textContent = isArabic ? "ع" : "En";
    initializeAudio();
    playSound(clickSound);
    updateUI();
    if (wordListArea.style.display === "block") showWordList(currentDifficulty); // Refresh word list if visible
});

function updateUI() {
    const lang = isArabic ? "ar" : "en";
    document.querySelectorAll("[data-translate]").forEach(el => {
        const key = el.getAttribute("data-translate");
        el.textContent = translations[lang][key] || el.textContent;
    });
    document.querySelectorAll("input[data-placeholder]").forEach(input => {
        const key = input.getAttribute("data-placeholder");
        input.placeholder = translations[lang][key] || input.placeholder;
    });
}

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
    const parts = [drawHead, drawBody, drawLeftArm, drawRightArm, drawLeftLeg, drawRightLeg]; // 6 parts
    if (incorrectGuesses <= parts.length) {
        ctx.beginPath();
        parts[incorrectGuesses - 1]();
        ctx.stroke();
    }
}

function updateHearts() {
    const remaining = MAX_GUESSES - incorrectGuesses;
    heartsDisplay.textContent = "❤️".repeat(remaining);
}

function showHeartsPopup() {
    const remaining = MAX_GUESSES - incorrectGuesses;
    heartsPopup.textContent = "❤️".repeat(remaining);
    heartsPopup.style.display = "block";
    setTimeout(() => {
        heartsPopup.style.display = "none";
    }, 1000); // Hide after 1 second
}

function displayWord() {
    const wordArray = selectedWord.split("");
    const display = wordArray
        .map(letter => (guessedLetters.includes(letter) || letter === " " ? letter : "_"))
        .join(" ");
    wordDisplay.textContent = display.toUpperCase();
    fixedWordDisplay.textContent = display.toUpperCase();
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
    const button = document.querySelector(`button[data-letter="${letter}"]`);
    if (selectedWord.includes(letter)) {
        playSound(clickSound);
        displayWord();
    } else {
        playSound(wrongSound);
        incorrectGuesses++;
        drawHangman();
        updateHearts();
        showHeartsPopup(); // Show remaining hearts popup
        if (button) button.disabled = true;
        if (incorrectGuesses >= MAX_GUESSES) endGame(false);
    }
}

function createKeyboard() {
    keyboard.innerHTML = "";
    const englishAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    const arabicAlphabet = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه ة و ي ى ء أ إ ئ ؤ ٱ ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩".split(" ");
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
        fixedTimer.textContent = timeString;
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
    const lang = isArabic ? "ar" : "en";
    
    if (won) {
        popupTitle.textContent = translations[lang]["Well done!"];
        popupScore.textContent = `Score: ${score}`;
        const stars = Math.ceil(score / 200);
        popupStars.textContent = "★".repeat(stars) + "☆".repeat(5 - stars);
        playSound(winSound);
        if (gameMode === "solo") markWordCompleted();
    } else {
        popupTitle.textContent = translations[lang]["Game Over!"];
        popupScore.textContent = `Word was: "${selectedWord}"`;
        popupStars.textContent = "";
        playSound(gameoverSound);
    }
    scorePopup.style.display = "block";
}

function endGame(won) {
    disableAllButtons();
    clearInterval(timerInterval);
    const lang = isArabic ? "ar" : "en";
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
        return alert(isArabic ? "تحتاج لاعبين على الأقل!" : "Need at least 2 players!");
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
        currentPlayerIndex = 0;
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
    table.innerHTML = `<tr><th data-translate="Player">${translations[isArabic ? "ar" : "en"]["Player"]}</th><th data-translate="Score">${translations[isArabic ? "ar" : "en"]["Score"]}</th></tr>`;
    players.sort((a, b) => b.score - a.score);
    const winner = players[0];
    players.forEach(p => {
        const row = document.createElement("tr");
        const nameCell = p === winner ? `<td class="winner">👑 ${p.name}</td>` : `<td>${p.name}</td>`;
        row.innerHTML = `${nameCell}<td>${p.score}</td>`;
        table.appendChild(row);
    });
}

function startSoloGame(difficulty, wordIndex) {
    currentDifficulty = difficulty;
    const words = isArabic ? arabicWords[difficulty] : englishWords[difficulty];
    const wordObj = words[wordIndex];
    selectedWord = wordObj.word.toUpperCase();
    hint = wordObj.hint;
    resetGame();
    startTimer();
}

function showWordList(difficulty) {
    currentDifficulty = difficulty;
    const words = isArabic ? arabicWords[difficulty] : englishWords[difficulty];
    const wordList = document.getElementById("word-list");
    const title = document.getElementById("word-list-title");
    const lang = isArabic ? "ar" : "en";
    title.textContent = `${translations[lang][difficulty.charAt(0).toUpperCase() + difficulty.slice(1)]} ${translations[lang]["Word List"]}`;
    title.className = difficulty; // Apply color class (easy, medium, hard)
    wordList.innerHTML = "";
    words.forEach((wordObj, index) => {
        const p = document.createElement("p");
        p.textContent = wordObj.hint;
        if (completedWords[difficulty].includes(wordObj.word.toUpperCase())) p.classList.add("completed");
        p.addEventListener("click", () => {
            playSound(clickSound);
            startSoloGame(difficulty, index);
            wordListArea.style.display = "none";
            soloGameArea.style.display = "block";
        });
        wordList.appendChild(p);
    });
    difficultySelect.style.display = "none";
    wordListArea.style.display = "block";
}

function markWordCompleted() {
    if (!completedWords[currentDifficulty].includes(selectedWord)) {
        completedWords[currentDifficulty].push(selectedWord);
        saveProgress();
    }
}

function saveProgress() {
    localStorage.setItem("hangmanProgress", JSON.stringify(completedWords));
}

function loadProgress() {
    const saved = localStorage.getItem("hangmanProgress");
    if (saved) completedWords = JSON.parse(saved);
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
    hintDisplay.textContent = `${translations[isArabic ? "ar" : "en"]["Hint: "]}${hint}`;
    displayWord();
    createKeyboard();
    message.textContent = "";
    timer.textContent = "";
    fixedTimer.textContent = "";
    currentPlayerDisplay.textContent = gameMode === "solo" ? "" : `${players[currentPlayerIndex].name}'s Turn`;
    document.getElementById("next-btn").style.display = "none";
    updateHearts(); // Start with 6 hearts
}

function showMainMenu() {
    mainMenu.style.display = "flex";
    languageSelect.style.display = "none";
    difficultySelect.style.display = "none";
    wordListArea.style.display = "none";
    soloGameArea.style.display = "none";
    partySetup.style.display = "none";
    onlineSetup.style.display = "none";
    secretInputPhase.style.display = "none";
    scorePopup.style.display = "none";
    readyPopup.style.display = "none";
    heartsPopup.style.display = "none";
    leaderboard.style.display = "none";
    currentPlayerDisplay.textContent = "";
    document.getElementById("start-party-btn").style.display = "block";
    document.getElementById("lets-go-btn").style.display = "none";
    fixedHeader.style.display = "none";
    updateUI();
}

document.getElementById("solo-btn").addEventListener("click", async () => {
    playSound(clickSound);
    gameMode = "solo";
    mainMenu.style.display = "none";
    languageSelect.style.display = "none";
    difficultySelect.style.display = "block";
    initializeAudio();
    await fetchWords();
    loadProgress();
    updateUI();
});

document.getElementById("easy-btn").addEventListener("click", () => {
    playSound(clickSound);
    showWordList("easy");
});

document.getElementById("medium-btn").addEventListener("click", () => {
    playSound(clickSound);
    showWordList("medium");
});

document.getElementById("hard-btn").addEventListener("click", () => {
    playSound(clickSound);
    showWordList("hard");
});

document.getElementById("difficulty-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    difficultySelect.style.display = "none";
    mainMenu.style.display = "flex";
});

document.getElementById("word-list-back-btn").addEventListener("click", () => {
    playSound(clickSound);
    wordListArea.style.display = "none";
    difficultySelect.style.display = "block";
});

document.getElementById("start-word-btn").addEventListener("click", () => {
    playSound(clickSound);
    const words = isArabic ? arabicWords[currentDifficulty] : englishWords[currentDifficulty];
    const incompleteWords = words.filter(w => !completedWords[currentDifficulty].includes(w.word.toUpperCase()));
    if (incompleteWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * incompleteWords.length);
        startSoloGame(currentDifficulty, words.indexOf(incompleteWords[randomIndex]));
        wordListArea.style.display = "none";
        soloGameArea.style.display = "block";
    } else {
        alert(isArabic ? "تم إكمال جميع الكلمات في هذه الصعوبة!" : "All words in this difficulty are completed!");
    }
});

document.getElementById("party-btn").addEventListener("click", () => {
    playSound(clickSound);
    gameMode = "party";
    mainMenu.style.display = "none";
    partySetup.style.display = "block";
    initializeAudio();
    updateUI();
});

document.getElementById("online-btn").addEventListener("click", () => {
    playSound(clickSound);
    gameMode = "online";
    mainMenu.style.display = "none";
    onlineSetup.style.display = "block";
    initializeAudio();
    updateUI();
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
        return alert(isArabic ? "تحتاج لاعبين على الأقل!" : "Need at least 2 players!");
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
        alert(isArabic ? "أدخل كلمة وتلميح!" : "Enter a word and hint!");
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
    soloGameArea.style.display = "none";
    wordListArea.style.display = "block";
    showWordList(currentDifficulty);
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
    soloGameArea.style.display = "none";
    wordListArea.style.display = "block";
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
    partySetup.style.display = "block";
    updateUI();
});

window.addEventListener("scroll", () => {
    const containerRect = document.querySelector(".container").getBoundingClientRect();
    const wordTimerRect = wordTimerContainer.getBoundingClientRect();
    if (wordTimerRect.bottom < containerRect.top + 40) {
        fixedHeader.style.display = "flex";
    } else {
        fixedHeader.style.display = "none";
    }
});

// Initial setup
document.querySelectorAll("button, h2").forEach(el => {
    if (el.textContent.trim() && !el.classList.contains("sound-toggle") && !el.classList.contains("music-toggle") && !el.classList.contains("dark-mode-toggle") && !el.classList.contains("language-toggle")) {
        el.setAttribute("data-translate", el.textContent.trim());
    }
});
document.querySelectorAll("input").forEach(input => {
    if (input.placeholder) input.setAttribute("data-placeholder", input.placeholder);
});
fetchWords().then(() => console.log("Words loaded")).catch(err => console.error("Failed to load words:", err));
updateUI();
showMainMenu();
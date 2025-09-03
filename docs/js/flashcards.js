document.addEventListener('DOMContentLoaded', async function() {
    // --- Get DOM Elements and URL Params ---
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');
    const deckId = urlParams.get('collection');
    const selectedUniId = localStorage.getItem('selectedUni');

    const deckTitleEl = document.getElementById('deck-title');
    const siteTitleEl = document.getElementById('site-title');
    const progressBar = document.getElementById('flashcard-progress-bar');
    const cardCounter = document.getElementById('card-counter');
    const flashcard = document.getElementById('flashcard');
    const frontFace = document.getElementById('flashcard-front');
    const backFace = document.getElementById('flashcard-back');
    const prevBtn = document.getElementById('prev-card-btn');
    const flipBtn = document.getElementById('flip-card-btn');
    const nextBtn = document.getElementById('next-card-btn');
    const viewer = document.getElementById('flashcard-viewer');
    const completionScreen = document.getElementById('completion-screen');
    const restartBtn = document.getElementById('restart-deck-btn');

    let currentCardIndex = 0;
    let deckData = null;
    let storageKey = '';

    // --- Load Data ---
    try {
        if (!selectedUniId || !path || !deckId) throw new Error("Missing parameters.");
        
        storageKey = `flashcard-progress-${selectedUniId}-${path}-${deckId}`;

        const response = await fetch('./database.json');
        const data = await response.json();
        const university = data.tree[selectedUniId];
        siteTitleEl.textContent = `${university.name} Med Portal`;

        let currentNode = university;
        for (const segment of path.split('/').filter(Boolean).slice(1)) {
            currentNode = currentNode.children[segment];
        }

        deckData = currentNode.resources?.flashcardDecks?.find(d => d.id === deckId);
        if (!deckData) throw new Error("Flashcard deck not found.");

        deckTitleEl.textContent = deckData.title;
        initializeDeck();

    } catch (error) {
        console.error("Flashcard Error:", error);
        deckTitleEl.textContent = "Error";
        viewer.innerHTML = `<p style="color:red; text-align:center;">${error.message}</p>`;
    }

    // --- Core Functions ---
    function initializeDeck() {
        const savedIndex = localStorage.getItem(storageKey);
        currentCardIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
        displayCard(currentCardIndex);
    }

    function displayCard(index) {
        if (!deckData || index < 0 || index >= deckData.cards.length) return;

        currentCardIndex = index;
        const card = deckData.cards[index];
        flashcard.classList.remove('is-flipped');
        frontFace.textContent = card.front;
        backFace.textContent = card.back;

        cardCounter.textContent = `Card ${index + 1} / ${deckData.cards.length}`;
        const progressPercent = ((index + 1) / deckData.cards.length) * 100;
        progressBar.style.width = `${progressPercent}%`;

        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === deckData.cards.length - 1;

        // Save progress to localStorage
        localStorage.setItem(storageKey, index);
    }

    function showCompletionScreen() {
        viewer.style.display = 'none';
        completionScreen.style.display = 'block';
        localStorage.removeItem(storageKey); // Clear progress
    }

    // --- Event Listeners ---
    flipBtn.addEventListener('click', () => flashcard.classList.toggle('is-flipped'));
    flashcard.addEventListener('click', () => flashcard.classList.toggle('is-flipped'));

    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < deckData.cards.length - 1) {
            displayCard(currentCardIndex + 1);
        } else {
            showCompletionScreen();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            displayCard(currentCardIndex - 1);
        }
    });

    restartBtn.addEventListener('click', () => {
        completionScreen.style.display = 'none';
        viewer.style.display = 'block';
        initializeDeck();
    });
});

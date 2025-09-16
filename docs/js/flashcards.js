document.addEventListener('DOMContentLoaded', async function () {
    // --- 1. DOM Element Setup ---
    const deckTitleEl = document.getElementById('deck-title');
    const cardFrontContentEl = document.getElementById('card-front-content');
    const cardBackContentEl = document.getElementById('card-back-content');
    const flashcardEl = document.getElementById('flashcard');
    const counterEl = document.getElementById('flashcard-counter');
    const progressBarEl = document.getElementById('flashcard-progress-bar');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn'); // زر لقلب البطاقة
    const siteTitleEl = document.getElementById('site-title');

    // --- 2. State Variables ---
    let mainDeck = [];
    let currentCardIndex = 0;
    let localStorageKey = '';

    // --- 3. Initialization ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const path = urlParams.get('path');
        const collectionId = urlParams.get('collection');
        const selectedUniId = localStorage.getItem('selectedUni');

        if (!selectedUniId || !path || !collectionId) {
            throw new Error('Missing parameters.');
        }

        localStorageKey = `flashcard-progress-${selectedUniId}-${path}-${collectionId}`;

        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();

        let currentNode = data.tree[selectedUniId];
        if (!currentNode) throw new Error("University not found.");

        siteTitleEl.textContent = `${currentNode.name} Med Portal`;

        const pathSegments = path.split('/').filter(Boolean);
        for (const segment of pathSegments) {
            if (currentNode.children && currentNode.children[segment]) {
                currentNode = currentNode.children[segment];
            } else {
                throw new Error(`Path segment "${segment}" not found in database.`);
            }
        }

        const flashcardDeck = currentNode.resources?.flashcardDecks?.find(deck => deck.id === collectionId);
        if (!flashcardDeck) throw new Error("Deck not found.");

        mainDeck = flashcardDeck.cards;
        deckTitleEl.textContent = flashcardDeck.title;

        loadProgress();
        displayCard(currentCardIndex);

    } catch (error) {
        console.error("Initialization Error:", error.message);
        deckTitleEl.textContent = `Error: ${error.message}`;
    }

    // --- 4. Core Functions ---
    function displayCard(index) {
        if (index >= mainDeck.length) {
            index = mainDeck.length - 1;
        }
        currentCardIndex = index;
        const card = mainDeck[currentCardIndex];

        flashcardEl.classList.remove('is-flipped');

        cardFrontContentEl.textContent = card.front;
        cardBackContentEl.textContent = card.back;

        updateProgress(currentCardIndex, mainDeck.length);
        saveProgress();
    }

    function updateProgress(index, total) {
        counterEl.textContent = `${index + 1} / ${total}`;
        progressBarEl.style.width = `${((index + 1) / total) * 100}%`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === total - 1;
    }

    function saveProgress() {
        localStorage.setItem(localStorageKey, currentCardIndex);
    }

    function loadProgress() {
        const savedIndex = localStorage.getItem(localStorageKey);
        if (savedIndex && parseInt(savedIndex, 10) < mainDeck.length) {
            currentCardIndex = parseInt(savedIndex, 10);
        } else {
            currentCardIndex = 0; // Reset if saved index is invalid
        }
    }

    // --- 5. Event Listeners ---
    flashcardEl.addEventListener('click', () => {
        flashcardEl.classList.toggle('is-flipped');
    });

    flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        flashcardEl.classList.toggle('is-flipped');
    });

    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            displayCard(currentCardIndex - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < mainDeck.length - 1) {
            displayCard(currentCardIndex + 1);
        }
    });
});

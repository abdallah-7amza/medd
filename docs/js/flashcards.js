document.addEventListener('DOMContentLoaded', async function () {
    // --- DOM Elements ---
    const deckTitleEl = document.getElementById('deck-title');
    const cardFrontContentEl = document.getElementById('card-front-content');
    const cardBackContentEl = document.getElementById('card-back-content');
    const flashcardEl = document.getElementById('flashcard');
    const counterEl = document.getElementById('flashcard-counter');
    const progressBarEl = document.querySelector('.progress-bar-inner');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const resetBtn = document.getElementById('reset-btn');
    const browseBtn = document.getElementById('browse-btn');
    const siteTitleEl = document.getElementById('site-title');

    let mainDeck = [];
    let currentCardIndex = 0;
    let localStorageKey = '';

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
        if (!response.ok) throw new Error('Database file not found.');
        const data = await response.json();

        let currentNode = data.tree[selectedUniId];
        if (!currentNode) throw new Error('University not found.');

        const pathSegments = path.split('/').filter(Boolean);
        for (const segment of pathSegments) {
            if (currentNode.children && currentNode.children[segment]) {
                currentNode = currentNode.children[segment];
            } else {
                throw new Error(`Path segment "${segment}" not found in database.`);
            }
        }

        const flashcardDeck = currentNode.resources?.flashcardDecks?.find(deck => deck.id === collectionId);
        if (!flashcardDeck) throw new Error('Deck not found.');

        mainDeck = flashcardDeck.cards;
        deckTitleEl.textContent = flashcardDeck.title;

        loadProgress();
        displayCard(currentCardIndex);

    } catch (error) {
        console.error('Initialization Error:', error.message);
        deckTitleEl.textContent = `Error: ${error.message}`;
    }

    function displayCard(index) {
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
        currentCardIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
    }

    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) displayCard(currentCardIndex - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < mainDeck.length - 1) displayCard(currentCardIndex + 1);
    });

    flipBtn.addEventListener('click', () => {
        flashcardEl.classList.toggle('is-flipped');
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset progress?')) {
            currentCardIndex = 0;
            saveProgress();
            displayCard(currentCardIndex);
        }
    });

    browseBtn.addEventListener('click', () => {
        alert('Browse functionality not implemented yet.');
    });
});

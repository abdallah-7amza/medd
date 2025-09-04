document.addEventListener('DOMContentLoaded', async function() {
    // Get parameters
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');
    const collectionId = urlParams.get('collection');
    const selectedUniId = localStorage.getItem('selectedUni');

    // Get DOM elements
    const deckTitleEl = document.getElementById('deck-title');
    const cardFrontContentEl = document.getElementById('card-front-content');
    const cardBackContentEl = document.getElementById('card-back-content');
    const flashcardEl = document.getElementById('flashcard');
    const counterEl = document.getElementById('flashcard-counter');
    const progressBarEl = document.getElementById('flashcard-progress-bar');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const siteTitleEl = document.getElementById('site-title');
    const navControls = document.getElementById('navigation-controls');
    const assessControls = document.getElementById('assessment-controls');
    const knowBtn = document.getElementById('know-btn');
    const stillLearningBtn = document.getElementById('still-learning-btn');

    let currentCardIndex = 0;
    let flashcardDeck = null;

    if (!selectedUniId || !path || !collectionId) {
        deckTitleEl.textContent = 'Error: Missing parameters.';
        return;
    }
    
    // Fetch and initialize
    try {
        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();

        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;
        const pathSegments = path.split('/').filter(Boolean);
        for (const segment of pathSegments.slice(1)) {
            currentNode = currentNode.children[segment];
        }

        flashcardDeck = currentNode.resources.flashcardDecks.find(deck => deck.id === collectionId);
        if (!flashcardDeck) throw new Error(`Deck with ID '${collectionId}' not found.`);

        deckTitleEl.textContent = flashcardDeck.title;
        displayCard(currentCardIndex);
    } catch (error) {
        deckTitleEl.textContent = `Error: ${error.message}`;
    }

    // Main display function
    function displayCard(index) {
        if (!flashcardDeck || !flashcardDeck.cards || flashcardDeck.cards.length === 0) return;
        
        flashcardEl.classList.remove('is-flipped');
        toggleControls(false); // Show navigation controls

        const card = flashcardDeck.cards[index];
        cardFrontContentEl.textContent = card.front;
        cardBackContentEl.textContent = card.back;

        updateProgress(index, flashcardDeck.cards.length);
    }

    function updateProgress(index, total) {
        counterEl.textContent = `${index + 1} / ${total}`;
        progressBarEl.style.width = `${((index + 1) / total) * 100}%`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === total - 1;
    }
    
    function toggleControls(showAssessment) {
        navControls.classList.toggle('hidden', showAssessment);
        assessControls.classList.toggle('hidden', !showAssessment);
    }
    
    function goToNextCard() {
        if (currentCardIndex < flashcardDeck.cards.length - 1) {
            currentCardIndex++;
            displayCard(currentCardIndex);
        }
    }

    // Event Listeners
    flashcardEl.addEventListener('click', () => {
        flashcardEl.classList.toggle('is-flipped');
        const isFlipped = flashcardEl.classList.contains('is-flipped');
        toggleControls(isFlipped);
    });

    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            displayCard(currentCardIndex);
        }
    });

    nextBtn.addEventListener('click', goToNextCard);
    knowBtn.addEventListener('click', goToNextCard);
    stillLearningBtn.addEventListener('click', goToNextCard);
});

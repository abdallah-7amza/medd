document.addEventListener('DOMContentLoaded', async function() {
    // Get parameters from the URL
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
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const siteTitleEl = document.getElementById('site-title');

    let currentCardIndex = 0;
    let flashcardDeck = null;

    if (!selectedUniId || !path || !collectionId) {
        deckTitleEl.textContent = 'Error: Missing required parameters.';
        return;
    }

    try {
        // Fetch the main database
        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();

        // Navigate to the correct node in the database tree
        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;
        const pathSegments = path.split('/').filter(Boolean);
        for (const segment of pathSegments.slice(1)) {
            currentNode = currentNode.children[segment];
        }

        if (!currentNode || !currentNode.resources || !currentNode.resources.flashcardDecks) {
            throw new Error("Flashcard deck not found in the database.");
        }

        // Find the specific deck by its ID
        flashcardDeck = currentNode.resources.flashcardDecks.find(deck => deck.id === collectionId);

        if (!flashcardDeck) {
            throw new Error(`Deck with ID '${collectionId}' not found.`);
        }

        // Initialize the first card
        deckTitleEl.textContent = flashcardDeck.title;
        displayCard(currentCardIndex);

    } catch (error) {
        console.error('Error:', error);
        deckTitleEl.textContent = `Error: ${error.message}`;
        deckTitleEl.style.color = 'red';
    }

    // Function to display a card at a specific index
    function displayCard(index) {
        if (!flashcardDeck || !flashcardDeck.cards || flashcardDeck.cards.length === 0) return;
        
        // Ensure the card is showing the front face
        flashcardEl.classList.remove('is-flipped');

        const card = flashcardDeck.cards[index];
        cardFrontContentEl.textContent = card.front;
        cardBackContentEl.textContent = card.back;

        // Update counter
        counterEl.textContent = `Card ${index + 1} / ${flashcardDeck.cards.length}`;

        // Enable/disable navigation buttons
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === flashcardDeck.cards.length - 1;
    }

    // Event listener for the flip button/card
    flipBtn.addEventListener('click', () => {
        flashcardEl.classList.toggle('is-flipped');
    });
    flashcardEl.addEventListener('click', () => {
        flashcardEl.classList.toggle('is-flipped');
    });

    // Event listener for the previous button
    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            displayCard(currentCardIndex);
        }
    });

    // Event listener for the next button
    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < flashcardDeck.cards.length - 1) {
            currentCardIndex++;
            displayCard(currentCardIndex);
        }
    });
});

document.addEventListener('DOMContentLoaded', async function() {
    // --- Get DOM Elements and URL Params ---
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path');
    const deckId = urlParams.get('collection'); // We'll reuse 'collection' param for simplicity
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

    let currentCardIndex = 0;
    let deckData = null;

    // --- Load Data ---
    try {
        if (!selectedUniId || !path || !deckId) throw new Error("Missing parameters.");

        const response = await fetch('database.json');
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
        displayCard(currentCardIndex);

    } catch (error) {
        console.error("Flashcard Error:", error);
        deckTitleEl.textContent = "Error";
        document.querySelector('.flashcard-viewer').innerHTML = `<p style="color:red; text-align:center;">${error.message}</p>`;
    }

    // --- Core Functions ---
    function displayCard(index) {
        if (!deckData || index < 0 || index >= deckData.cards.length) return;

        currentCardIndex = index;
        const card = deckData.cards[index];

        // Reset flip state
        flashcard.classList.remove('is-flipped');

        // Set content
        frontFace.textContent = card.front;
        backFace.textContent = card.back;

        // Update UI
        cardCounter.textContent = `Card ${index + 1} / ${deckData.cards.length}`;
        const progressPercent = ((index + 1) / deckData.cards.length) * 100;
        progressBar.style.width = `${progressPercent}%`;

        // Update button states
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === deckData.cards.length - 1;
    }

    // --- Event Listeners ---
    flipBtn.addEventListener('click', () => {
        flashcard.classList.toggle('is-flipped');
    });

    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('is-flipped');
    });

    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < deckData.cards.length - 1) {
            displayCard(currentCardIndex + 1);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            displayCard(currentCardIndex - 1);
        }
    });
});

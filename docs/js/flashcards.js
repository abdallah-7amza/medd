document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. DOM Element Setup ---
    const deckTitleEl = document.getElementById('deck-title');
    const cardFrontContentEl = document.getElementById('card-front-content');
    const cardBackContentEl = document.getElementById('card-back-content');
    const cardFrontImageEl = document.getElementById('card-front-image');
    const cardBackImageEl = document.getElementById('card-back-image');
    const flashcardEl = document.getElementById('flashcard');
    const counterEl = document.getElementById('flashcard-counter');
    const progressBarEl = document.querySelector('.progress-bar-inner');
    const siteTitleEl = document.getElementById('site-title');

    // Controls
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const learnedBtn = document.getElementById('learned-btn');
    const notLearnedBtn = document.getElementById('not-learned-btn');
    const resetBtn = document.getElementById('reset-btn');
    const browseBtn = document.getElementById('browse-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Containers
    const navigationControls = document.getElementById('navigation-controls');
    const assessmentControls = document.getElementById('assessment-controls');
    const browseModal = document.getElementById('browse-modal');
    const browseList = document.getElementById('browse-list');

    // --- 2. State Variables ---
    let fullDeck = []; // The original, complete deck of cards
    let activeDeck = []; // The deck currently in use (can be filtered)
    let currentCardIndex = 0;
    let isReviewing = false;
    let localStorageKey = '';

    // --- 3. Initialization ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const path = urlParams.get('path');
        const collectionId = urlParams.get('collection');
        const selectedUniId = localStorage.getItem('selectedUni');

        if (!selectedUniId || !path || !collectionId) {
            throw new Error('Required parameters are missing from the URL.');
        }

        localStorageKey = `flashcard-progress-${selectedUniId}-${path.replace(/\//g, '-')}-${collectionId}`;

        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Could not load database.json. Please check the file path.");
        const data = await response.json();

        // Navigate through the data tree to find the correct node
        let currentNode = data.tree[selectedUniId];
        if (!currentNode) throw new Error("University not found in database.");
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;

        const pathSegments = path.split('/').filter(p => p && p !== 'content' && p !== 'universities' && p !== selectedUniId);
        for (const segment of pathSegments) {
            if (currentNode.children && currentNode.children[segment]) {
                currentNode = currentNode.children[segment];
            } else {
                throw new Error(`Path segment "${segment}" not found in database.`);
            }
        }
        
        const flashcardDeckData = currentNode.resources?.flashcardDecks?.find(deck => deck.id === collectionId);
        if (!flashcardDeckData || !flashcardDeckData.cards) throw new Error("Flashcard deck not found.");

        fullDeck = flashcardDeckData.cards.map((card, index) => ({ ...card, id: index, learned: false }));
        deckTitleEl.textContent = flashcardDeckData.title;

        loadProgress();
        startSession();

    } catch (error) {
        console.error("Initialization Error:", error);
        deckTitleEl.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        document.querySelector('.flashcard-master-container').style.display = 'none'; // Hide UI on error
    }

    // --- 4. Core Functions ---

    function startSession() {
        const unlearnedCards = fullDeck.filter(card => !card.learned);
        if (unlearnedCards.length === 0) {
            activeDeck = [...fullDeck]; // If all learned, start a review session
            isReviewing = true;
        } else {
            activeDeck = shuffleArray([...unlearnedCards]);
            isReviewing = false;
        }
        currentCardIndex = 0;
        displayCard(currentCardIndex);
    }

    function displayCard(index) {
        if (!activeDeck || activeDeck.length === 0) {
            showCompletionScreen();
            return;
        }
        
        // Ensure index is within bounds
        currentCardIndex = Math.max(0, Math.min(index, activeDeck.length - 1));

        const card = activeDeck[currentCardIndex];
        
        flashcardEl.classList.remove('is-flipped');
        navigationControls.style.display = 'flex';
        assessmentControls.style.display = 'none';

        // Set text content using Marked.js for Markdown support
        cardFrontContentEl.innerHTML = marked.parse(card.front || '');
        cardBackContentEl.innerHTML = marked.parse(card.back || '');

        // Handle images
        toggleImage(cardFrontImageEl, card.frontImage);
        toggleImage(cardBackImageEl, card.backImage);

        updateUI();
        saveProgress();
    }
    
    function handleAssessment(learned) {
        const cardId = activeDeck[currentCardIndex].id;
        const originalCard = fullDeck.find(c => c.id === cardId);
        originalCard.learned = learned;

        if (learned) {
             // Optional: confetti/sound effect
        } else {
            // Logic for "Not Learned" if any (e.g., move to end of deck)
        }
        
        // Move to the next card automatically
        if (currentCardIndex >= activeDeck.length - 1) {
            startSession(); // All cards assessed, restart with remaining/all
        } else {
            displayCard(currentCardIndex + 1);
        }
    }

    function showCompletionScreen() {
        cardFrontContentEl.innerHTML = '<h2>Deck Complete!</h2><p>You have learned all cards in this deck. Reset to study again.</p>';
        cardBackContentEl.innerHTML = '';
        toggleImage(cardFrontImageEl, null);
        toggleImage(cardBackImageEl, null);
        navigationControls.style.display = 'none';
        assessmentControls.style.display = 'none';
        counterEl.textContent = 'Completed';
        progressBarEl.style.width = '100%';
    }

    // --- 5. UI & Utility Functions ---

    function updateUI() {
        const totalInSession = activeDeck.length;
        const learnedInDeck = fullDeck.filter(c => c.learned).length;
        const totalInDeck = fullDeck.length;

        counterEl.textContent = `${currentCardIndex + 1} / ${totalInSession}`;
        progressBarEl.style.width = `${(learnedInDeck / totalInDeck) * 100}%`;
        
        prevBtn.disabled = currentCardIndex === 0;
        nextBtn.disabled = currentCardIndex === totalInSession - 1;
    }
    
    function toggleImage(imgElement, src) {
        if (src) {
            imgElement.src = src;
            imgElement.style.display = 'block';
        } else {
            imgElement.style.display = 'none';
        }
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function buildBrowseList() {
        browseList.innerHTML = '';
        fullDeck.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'browse-item';
            item.innerHTML = `
                <div class="browse-front">${marked.parse(card.front)}</div>
                <div class="browse-back">${marked.parse(card.back)}</div>
            `;
            browseList.appendChild(item);
        });
    }

    // --- 6. Persistence (Save/Load Progress) ---

    function saveProgress() {
        const progress = fullDeck.map(card => ({ id: card.id, learned: card.learned }));
        localStorage.setItem(localStorageKey, JSON.stringify(progress));
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem(localStorageKey);
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                progress.forEach(p => {
                    const card = fullDeck.find(c => c.id === p.id);
                    if (card) card.learned = p.learned;
                });
            } catch (e) {
                console.error("Failed to parse saved progress.");
                // Reset progress if it's corrupted
                localStorage.removeItem(localStorageKey);
            }
        }
    }

    // --- 7. Event Listeners ---

    revealBtn.addEventListener('click', () => {
        flashcardEl.classList.add('is-flipped');
        navigationControls.style.display = 'none';
        assessmentControls.style.display = 'flex';
    });
    
    flashcardEl.addEventListener('click', () => {
        if (!flashcardEl.classList.contains('is-flipped')) {
             revealBtn.click();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            displayCard(currentCardIndex - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentCardIndex < activeDeck.length - 1) {
            displayCard(currentCardIndex + 1);
        }
    });

    learnedBtn.addEventListener('click', () => handleAssessment(true));
    notLearnedBtn.addEventListener('click', () => handleAssessment(false));

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all progress for this deck?')) {
            fullDeck.forEach(card => card.learned = false);
            saveProgress();
            startSession();
        }
    });
    
    browseBtn.addEventListener('click', () => {
        buildBrowseList();
        browseModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        browseModal.classList.add('hidden');
    });
    
    browseModal.addEventListener('click', (e) => {
        if (e.target === browseModal) {
             browseModal.classList.add('hidden');
        }
    });
});

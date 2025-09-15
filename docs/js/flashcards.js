document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. DOM Element Setup ---
    const deckTitleEl = document.getElementById('deck-title');
    const siteTitleEl = document.getElementById('site-title');
    const flashcardEl = document.getElementById('flashcard');
    const cardFrontContentEl = document.getElementById('card-front-content');
    const cardBackContentEl = document.getElementById('card-back-content');
    const cardFrontImageEl = document.getElementById('card-front-image');
    const cardBackImageEl = document.getElementById('card-back-image');
    const counterEl = document.getElementById('flashcard-counter');
    const progressBarEl = document.querySelector('.progress-bar-inner');
    
    // Controls
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const notLearnedBtn = document.getElementById('not-learned-btn');
    const learnedBtn = document.getElementById('learned-btn');
    const navigationControls = document.getElementById('navigation-controls');
    const assessmentControls = document.getElementById('assessment-controls');

    // Header Controls
    const browseBtn = document.getElementById('browse-btn');
    const resetBtn = document.getElementById('reset-btn');
    const celebrationToggle = document.getElementById('celebration-toggle');
    const CELEBRATION_KEY = 'celebrationModeEnabled';

    // Browse Modal
    const browseModal = document.getElementById('browse-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const browseList = document.getElementById('browse-list');

    // --- 2. State Variables ---
    let fullDeck = []; // The original, unmodified deck of cards
    let sessionQueue = []; // The dynamic queue for the current study session
    let currentIndexInQueue = 0;
    let localStorageKey = '';

    // --- 3. Initialization ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const path = urlParams.get('path');
        const collectionId = urlParams.get('deck') || urlParams.get('collection'); // Using 'deck' as a clearer param name
        const selectedUniId = localStorage.getItem('selectedUni');

        if (!selectedUniId || !path || !collectionId) throw new Error('Missing parameters.');

        localStorageKey = `flashcard-progress-${path}-${collectionId}`;

        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();

        // Navigate through the database tree
        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;
        const pathSegments = path.split('/').filter(Boolean).slice(1);
        for (const segment of pathSegments) {
            currentNode = currentNode.children[segment];
        }

        const flashcardDeck = currentNode.resources?.flashcardDecks?.find(deck => deck.id === collectionId);
        if (!flashcardDeck || !flashcardDeck.cards) throw new Error("Deck not found.");

        fullDeck = flashcardDeck.cards;
        deckTitleEl.textContent = flashcardDeck.title || collectionId.replace(/[-_]/g, ' ');

        setupSettings();
        populateBrowseModal();
        startSession();

    } catch (error) {
        deckTitleEl.textContent = `Error: ${error.message}`;
        document.querySelector('.flashcard-master-container').style.display = 'none';
    }

    // --- 4. Session Management ---
    function startSession() {
        const savedQueue = localStorage.getItem(localStorageKey);
        if (savedQueue) {
            sessionQueue = JSON.parse(savedQueue);
        } else {
            // If no saved progress, start with a full deck
            sessionQueue = Array.from(Array(fullDeck.length).keys()); // Queue of indices
        }
        
        currentIndexInQueue = 0;

        if (sessionQueue.length === 0) {
            displayCompletion();
        } else {
            displayCard(currentIndexInQueue);
        }
    }

    function saveProgress() {
        localStorage.setItem(localStorageKey, JSON.stringify(sessionQueue));
    }

    // --- 5. Card Display & Logic ---
    function displayCard(queueIndex) {
        if (sessionQueue.length === 0) {
            displayCompletion();
            return;
        }

        currentIndexInQueue = queueIndex;
        const cardIndex = sessionQueue[currentIndexInQueue];
        const card = fullDeck[cardIndex];

        // Reset card state
        flashcardEl.classList.remove('is-flipped');
        assessmentControls.style.display = 'none';
        navigationControls.style.display = 'flex';

        // Render Markdown content
        cardFrontContentEl.innerHTML = marked.parse(card.question || '');
        cardBackContentEl.innerHTML = marked.parse(card.answer || '');

        // Handle images
        toggleImageView(card.questionImage, cardFrontImageEl);
        toggleImageView(card.answerImage, cardBackImageEl);

        updateProgress();
    }

    function toggleImageView(imageUrl, imgElement) {
        if (imageUrl) {
            imgElement.src = imageUrl;
            imgElement.style.display = 'block';
        } else {
            imgElement.style.display = 'none';
        }
    }
    
    function revealAnswer() {
        flashcardEl.classList.add('is-flipped');
        navigationControls.style.display = 'none';
        assessmentControls.style.display = 'flex';
    }

    function handleAssessment(wasLearned) {
        const currentCardIndex = sessionQueue[currentIndexInQueue];
        
        if (wasLearned) {
            // Remove from queue
            sessionQueue.splice(currentIndexInQueue, 1);
             // Celebration!
            const isCelebrationEnabled = localStorage.getItem(CELEBRATION_KEY) === 'true';
            if (isCelebrationEnabled) {
                if (typeof Tone !== 'undefined') {
                    const synth = new Tone.Synth().toDestination();
                    synth.triggerAttackRelease("C5", "8n");
                }
                if (typeof confetti === 'function') {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            }
        } else {
            // Move to the back of the queue
            const cardToReAdd = sessionQueue.splice(currentIndexInQueue, 1)[0];
            sessionQueue.push(cardToReAdd);
        }

        saveProgress();
        
        // Move to the next card in the modified queue
        if (currentIndexInQueue >= sessionQueue.length) {
            currentIndexInQueue = 0; // Loop back to start if we were at the end
        }

        displayCard(currentIndexInQueue);
    }
    
    function displayCompletion() {
        flashcardEl.classList.remove('is-flipped');
        cardFrontContentEl.innerHTML = "<h2>Deck Complete!</h2><p>You've reviewed all the cards.</p>";
        cardBackContentEl.innerHTML = "";
        toggleImageView(null, cardFrontImageEl);
        toggleImageView(null, cardBackImageEl);
        navigationControls.style.display = 'flex';
        assessmentControls.style.display = 'none';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        revealBtn.disabled = true;
    }

    // --- 6. UI Updates & Controls ---
    function updateProgress() {
        const total = fullDeck.length;
        const remaining = sessionQueue.length;
        const learned = total - remaining;
        
        counterEl.textContent = `Learned: ${learned} / ${total}`;
        progressBarEl.style.width = total > 0 ? `${(learned / total) * 100}%` : '0%';
        
        prevBtn.disabled = currentIndexInQueue === 0;
        nextBtn.disabled = currentIndexInQueue >= sessionQueue.length - 1;
    }

    function setupSettings() {
        let isCelebrationEnabled = localStorage.getItem(CELEBRATION_KEY) === 'true';
        celebrationToggle.checked = isCelebrationEnabled;
        celebrationToggle.addEventListener('change', function() {
            localStorage.setItem(CELEBRATION_KEY, this.checked);
        });
    }

    function populateBrowseModal() {
        browseList.innerHTML = '';
        fullDeck.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'browse-item';
            const questionHTML = marked.parse(card.question || '');
            const answerHTML = marked.parse(card.answer || '');
            item.innerHTML = `
                <div class="browse-question"><strong>Q${index + 1}:</strong> ${questionHTML}</div>
                <div class="browse-answer"><strong>A:</strong> ${answerHTML}</div>
            `;
            browseList.appendChild(item);
        });
    }

    // --- 7. Event Listeners ---
    revealBtn.addEventListener('click', revealAnswer);
    learnedBtn.addEventListener('click', () => handleAssessment(true));
    notLearnedBtn.addEventListener('click', () => handleAssessment(false));

    prevBtn.addEventListener('click', () => {
        if (currentIndexInQueue > 0) {
            displayCard(currentIndexInQueue - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndexInQueue < sessionQueue.length - 1) {
            displayCard(currentIndexInQueue + 1);
        }
    });

    resetBtn.addEventListener('click', () => {
        localStorage.removeItem(localStorageKey);
        window.location.reload();
    });

    browseBtn.addEventListener('click', () => browseModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => browseModal.classList.add('hidden'));
    browseModal.addEventListener('click', (e) => {
        if (e.target === browseModal) {
            browseModal.classList.add('hidden');
        }
    });
});

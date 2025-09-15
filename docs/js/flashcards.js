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
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const notLearnedBtn = document.getElementById('not-learned-btn');
    const learnedBtn = document.getElementById('learned-btn');
    const navigationControls = document.getElementById('navigation-controls');
    const assessmentControls = document.getElementById('assessment-controls');
    const browseBtn = document.getElementById('browse-btn');
    const resetBtn = document.getElementById('reset-btn');
    const celebrationToggle = document.getElementById('celebration-toggle');
    const CELEBRATION_KEY = 'celebrationModeEnabled';
    const browseModal = document.getElementById('browse-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const browseList = document.getElementById('browse-list');

    // --- 2. State Variables ---
    let fullDeck = [];
    let sessionQueue = [];
    let currentIndexInQueue = 0;
    let localStorageKey = '';

    // --- 3. Initialization ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const path = urlParams.get('path');
        const collectionId = urlParams.get('deck') || urlParams.get('collection');
        const selectedUniId = localStorage.getItem('selectedUni');

        if (!selectedUniId || !path || !collectionId) throw new Error('Missing parameters.');

        localStorageKey = `flashcard-progress-${path}-${collectionId}`;

        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();

        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;
        const pathSegments = path.split('/').filter(Boolean).slice(1);
        for (const segment of pathSegments) {
            currentNode = currentNode.children[segment];
        }
        
        // The safe way to access the deck using optional chaining (?.)
        const flashcardDeck = currentNode.resources?.flashcardDecks?.find(deck => deck.id === collectionId);
        if (!flashcardDeck || !flashcardDeck.cards) throw new Error("Deck not found in this topic.");

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
            sessionQueue = Array.from(Array(fullDeck.length).keys());
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
        flashcardEl.classList.remove('is-flipped');
        assessmentControls.style.display = 'none';
        navigationControls.style.display = 'flex';
        cardFrontContentEl.innerHTML = marked.parse(card.question || '');
        cardBackContentEl.innerHTML = marked.parse(card.answer || '');
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
        if (wasLearned) {
            sessionQueue.splice(currentIndexInQueue, 1);
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
            const cardToReAdd = sessionQueue.splice(currentIndexInQueue, 1)[0];
            sessionQueue.push(cardToReAdd);
        }
        saveProgress();
        if (currentIndexInQueue >= sessionQueue.length) {
            currentIndexInQueue = 0;
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

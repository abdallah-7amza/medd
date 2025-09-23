/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. GET URL PARAMS AND DOM ELEMENTS ---
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const collectionId = urlParams.get('collection');
    const isLessonQuiz = urlParams.has('lessonQuiz');
    const selectedUniId = localStorage.getItem('selectedUni');

    // ... (All existing DOM element variables)
    const siteTitleEl = document.getElementById('site-title');
    const questionCounter = document.getElementById('question-counter');
    const questionStem = document.getElementById('question-stem');
    const optionsContainer = document.getElementById('options-container');
    const explanationContainer = document.getElementById('explanation-container');
    const submitBtn = document.getElementById('submit-btn');
    const prevBtn = document.getElementById('prev-btn');
    const progressBar = document.getElementById('progress-bar');
    const quizInterface = document.getElementById('quiz-interface');
    const resultsScreen = document.getElementById('results-screen');
    const reviewScreen = document.getElementById('review-screen');
    const scoreDisplay = document.getElementById('score-display');
    const reviewBtn = document.getElementById('review-btn');
    const browseBtn = document.getElementById('browse-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const browseList = document.getElementById('browse-list');
    const resetBtn = document.getElementById('reset-btn');

    // ## START SURGICAL ADDITION 1: New variables for Celebration Mode ##
    const celebrationToggle = document.getElementById('celebration-toggle');
    const CELEBRATION_KEY = 'celebrationModeEnabled';
    // ## END SURGICAL ADDITION 1 ##

    let currentQuestionIndex = 0;
    let userAnswers = [];
    let quizData = null;
    let storageKey = '';

    // --- 2. LOAD QUIZ DATA ---
    try {
        if (!selectedUniId || !path) throw new Error("University or Path not specified.");

        // **SURGICAL REPLACEMENT: New logic to load quiz data**
        const versionData = await fetchAndCacheVersion();
        if (!versionData) {
            showError('Failed to load version data.');
            return;
        }

        const quizId = path.split('/').pop();
        const folderPath = path.substring(0, path.lastIndexOf('/'));
        const folderHash = versionData.hashes[folderPath.split('/').slice(-1)[0]];
        const quizContent = await loadQuizContent(path, folderHash);

        if (!quizContent || !quizContent.quizData || !quizContent.quizData.questions) {
            throw new Error('Quiz data could not be found.');
        }
        
        quizData = quizContent.quizData;
        storageKey = `quiz-progress-${path}`;

        // ## START SURGICAL ADDITION 2: Call the new settings function ##
        setupSettings();
        // ## END SURGICAL ADDITION 2 ##

        populateBrowseModal();
        initializeQuiz();
        // **END OF SURGICAL REPLACEMENT**

    } catch (error) {
        showError(error.message);
    }

    // --- 3. ALL QUIZ FUNCTIONS (STABLE VERSION) ---
    // ... (All existing functions as they were, from initializeQuiz() to showError())

    function initializeQuiz() {
        const savedProgress = localStorage.getItem(storageKey);
        userAnswers = savedProgress ? JSON.parse(savedProgress) : new Array(quizData.questions.length).fill(null);
    
        let resumeIndex = userAnswers.findIndex(answer => answer === null);
        if (resumeIndex === -1) { // If all answered, show results
            showResults();
            return;
        }
    
        displayQuestion(resumeIndex);
    }

    function displayQuestion(index) {
        currentQuestionIndex = index;
        const question = quizData.questions[index];
        questionCounter.textContent = `Question ${index + 1} of ${quizData.questions.length}`;
        questionStem.textContent = question.stem;
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('options-disabled');
        explanationContainer.style.display = 'none';
    
        question.options.forEach((option, i) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `<input type="radio" name="answer" value="${i}" id="option-${i}"><label for="option-${i}">${option}</label>`;
            if (userAnswers[index] === i) {
                optionElement.querySelector('input').checked = true;
            }
            optionElement.addEventListener('click', () => selectOption(i));
            optionsContainer.appendChild(optionElement);
        });
    
        if (userAnswers[index] !== null) {
            showFeedback();
        }
        updateNavigation();
    }

    function selectOption(selectedIndex) {
        if (optionsContainer.classList.contains('options-disabled')) return;
        userAnswers[currentQuestionIndex] = selectedIndex;
        localStorage.setItem(storageKey, JSON.stringify(userAnswers));
        document.querySelector(`input[value='${selectedIndex}']`).checked = true;
        showFeedback();
        updateNavigation();
    }

    // ## START SURGICAL MODIFICATION 4: The updated feedback function ##
    function showFeedback() {
        optionsContainer.classList.add('options-disabled');
        const correctIndex = quizData.questions[currentQuestionIndex].correct;
        const explanationText = quizData.questions[currentQuestionIndex].explanation;

        // Check if the user's answer is correct AND celebration mode is on
        const isCelebrationEnabled = localStorage.getItem(CELEBRATION_KEY) === 'true';
        if (userAnswers[currentQuestionIndex] === correctIndex && isCelebrationEnabled) {
            // 1. Play a light, popping sound effect
            if (typeof Tone !== 'undefined') {
                const synth = new Tone.Synth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
                }).toDestination();
                synth.triggerAttackRelease("C6", "8n");
            }

            // 2. Launch the confetti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
        }

        // This part is untouched and works as before
        document.querySelectorAll('.option').forEach((opt, i) => {
            if (i === correctIndex) opt.classList.add('correct');
            else if (userAnswers[currentQuestionIndex] === i) opt.classList.add('incorrect');
        });

        if (explanationText) {
            explanationContainer.innerHTML = `<strong>Explanation:</strong> ${explanationText}`;
            explanationContainer.style.display = 'block';
        }
    }
    // ## END SURGICAL MODIFICATION 4 ##

    function updateNavigation() {
        prevBtn.disabled = currentQuestionIndex === 0;
        submitBtn.disabled = userAnswers[currentQuestionIndex] === null;
        submitBtn.textContent = (currentQuestionIndex === quizData.questions.length - 1) ? 'Submit' : 'Next';
        updateProgressBar();
    }

    function updateProgressBar() {
        const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function showResults() {
        let score = 0;
        quizData.questions.forEach((q, i) => {
            if (userAnswers[i] === q.correct) score++;
        });
        scoreDisplay.textContent = `You scored ${score} out of ${quizData.questions.length}`;
        quizInterface.style.display = 'none';
        resultsScreen.style.display = 'block';
    }

    function showReview() {
        resultsScreen.style.display = 'none';
        reviewScreen.style.display = 'block';
        reviewScreen.innerHTML = '<h2>Quiz Review</h2>';
    
        quizData.questions.forEach((question, index) => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'review-question-block';
            let optionsHTML = '';
            question.options.forEach((option, i) => {
                let className = 'option';
                if (i === question.correct) className += ' correct';
                else if (i === userAnswers[index]) className += ' incorrect';
                optionsHTML += `<div class="${className}">${option}</div>`;
            });
            questionBlock.innerHTML = `
                <h3>Q${index + 1}: ${question.stem}</h3>
                <div class="options-container">${optionsHTML}</div>
                ${question.explanation ? `<div class="review-explanation"><strong>Explanation:</strong> ${question.explanation}</div>` : ''}
            `;
            reviewScreen.appendChild(questionBlock);
        });

        const backBtn = document.createElement('button');
        backBtn.textContent = 'Back to Results';
        backBtn.className = 'button button-secondary';
        backBtn.onclick = () => {
            reviewScreen.style.display = 'none';
            resultsScreen.style.display = 'block';
        };
        reviewScreen.appendChild(backBtn);
    }
    
    function populateBrowseModal() {
        browseList.innerHTML = '';
        quizData.questions.forEach((question, index) => {
            const item = document.createElement('div');
            item.className = 'browse-item';
            let optionsHTML = '';
            question.options.forEach((optionText, i) => {
                let className = 'browse-option';
                if (i === question.correct) {
                    className += ' correct-answer';
                }
                optionsHTML += `<div class="${className}">${optionText}</div>`;
            });
            item.innerHTML = `
                <h3 class="browse-question">Q${index + 1}: ${question.stem}</h3>
                ${optionsHTML}
                <div class="browse-explanation">${question.explanation}</div>
            `;
            browseList.appendChild(item);
        });
    }

    function showError(message) {
        quizInterface.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
    }
    
    // ## START SURGICAL ADDITION 3: The new settings function ##
    function setupSettings() {
        // Load saved setting on page load
        let isCelebrationEnabled = localStorage.getItem(CELEBRATION_KEY) === 'true';
        celebrationToggle.checked = isCelebrationEnabled;
    
        // Listen for toggle changes and save the new setting
        celebrationToggle.addEventListener('change', function() {
            localStorage.setItem(CELEBRATION_KEY, this.checked);
        });
    }
    // ## END SURGICAL ADDITION 3 ##

    // --- EVENT LISTENERS ---
    submitBtn.addEventListener('click', () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            displayQuestion(currentQuestionIndex + 1);
        } else {
            showResults();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            displayQuestion(currentQuestionIndex - 1);
        }
    });

    reviewBtn.addEventListener('click', showReview);

    browseBtn.addEventListener('click', () => {
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

    resetBtn.addEventListener('click', () => {
        localStorage.removeItem(storageKey);
        window.location.reload();
    });

    // --- NEW CORE FUNCTIONS FOR CACHING ---
    const contentKey = 'contentData';

    async function fetchAndCacheVersion() {
        const versionFile = './version.json';
        try {
            const response = await fetch(versionFile);
            if (!response.ok) throw new Error('Network response was not ok.');
            const versionData = await response.json();
            localStorage.setItem('contentVersion', JSON.stringify(versionData));
            return versionData;
        } catch (error) {
            console.error('Failed to fetch version file:', error);
            return null;
        }
    }

    async function loadQuizContent(path, hash) {
        const cachedContent = localStorage.getItem(contentKey);
        let contentData = cachedContent ? JSON.parse(cachedContent) : {};
        const currentHash = contentData.hashes?.[path];

        if (currentHash === hash && contentData.data?.[path]) {
            return contentData.data[path];
        }

        const contentUrl = `${path}.json`;
        try {
            const response = await fetch(contentUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const newContent = await response.json();

            contentData.hashes = contentData.hashes || {};
            contentData.data = contentData.data || {};
            contentData.hashes[path] = hash;
            contentData.data[path] = newContent;
            localStorage.setItem(contentKey, JSON.stringify(contentData));
            
            return { quizData: newContent };
        } catch (error) {
            console.error('Failed to fetch quiz content:', error);
            return null;
        }
    }

    // Initial call to start the app
    loadAndDisplayQuiz();
});

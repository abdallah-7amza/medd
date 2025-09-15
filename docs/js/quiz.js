document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. GET URL PARAMS AND DOM ELEMENTS ---
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const collectionId = urlParams.get('collection');
    const isLessonQuiz = urlParams.has('lessonQuiz');
    const selectedUniId = localStorage.getItem('selectedUni');

    // All DOM elements are fetched here...
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
    const browseModal = document.getElementById('browse-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const browseList = document.getElementById('browse-list');
    const resetBtn = document.getElementById('reset-btn');

    // --- NEW STATE VARIABLES FOR THE SMART QUIZ ---
    let quizData = null;
    let storageKey = '';
    let questionQueue = []; // Holds the indices of questions left to answer
    let userAnswers = [];   // Always stores the last answer for each question index
    let totalQuestionsInQuiz = 0;

    // --- 2. LOAD QUIZ DATA ---
    try {
        if (!selectedUniId || !path) throw new Error("University or Path not specified.");

        const response = await fetch('./database.json');
        const data = await response.json();
        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;

        const pathSegments = path.split('/').filter(Boolean).slice(1);
        for (const segment of pathSegments) {
            currentNode = currentNode.children[segment];
        }

        if (isLessonQuiz) {
            quizData = currentNode.resources?.lessonQuiz;
            storageKey = `quiz-progress-${path}`;
        } else if (collectionId) {
            const collectionQuiz = currentNode.resources?.collectionQuizzes?.find(q => q.id === collectionId);
            quizData = collectionQuiz?.quizData;
            storageKey = `quiz-progress-${path}-${collectionId}`;
        }

        if (!quizData || !quizData.questions) throw new Error('Quiz data could not be found.');
        
        totalQuestionsInQuiz = quizData.questions.length;
        populateBrowseModal();
        initializeQuiz();

    } catch (error) {
        showError(error.message);
    }

    // --- 3. CORE QUIZ FUNCTIONS (REBUILT) ---
    function initializeQuiz() {
        const savedProgress = localStorage.getItem(storageKey);
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            userAnswers = progress.userAnswers;
            questionQueue = progress.questionQueue;
        } else {
            // First time: queue has all questions, answers are all null
            questionQueue = Array.from({length: totalQuestionsInQuiz}, (_, i) => i);
            userAnswers = new Array(totalQuestionsInQuiz).fill(null);
        }

        prevBtn.style.display = 'none'; // Previous button is not logical in this mode

        if (questionQueue.length > 0) {
            displayQuestion(questionQueue[0]); // Display the first question in the queue
        } else {
            showResults(); // Quiz was already completed
        }
    }

    function displayQuestion(questionIndex) {
        const question = quizData.questions[questionIndex];
        questionCounter.textContent = `Remaining Questions: ${questionQueue.length}`;
        questionStem.textContent = question.stem;
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('options-disabled');
        explanationContainer.style.display = 'none';

        question.options.forEach((option, i) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `<input type="radio" name="answer" value="${i}" id="option-${i}"><label for="option-${i}">${option}</label>`;
            optionElement.addEventListener('click', () => selectOption(questionIndex, i));
            optionsContainer.appendChild(optionElement);
        });
        updateNavigation(false); // Disable next button initially
    }

    function selectOption(questionIndex, selectedIndex) {
        if (optionsContainer.classList.contains('options-disabled')) return;

        userAnswers[questionIndex] = selectedIndex; // Store the last answer
        
        const isCorrect = selectedIndex === quizData.questions[questionIndex].correct;

        // If the answer is correct, remove it from the queue
        if (isCorrect) {
            questionQueue.shift(); // Remove the current question (which is always at the start)
        } else {
            // If incorrect, move it from the front to a random later position
            const currentQuestion = questionQueue.shift();
            const randomIndex = Math.floor(Math.random() * questionQueue.length) + 1;
            questionQueue.splice(randomIndex, 0, currentQuestion);
        }

        showFeedback(questionIndex, selectedIndex);
        updateNavigation(true); // Enable next button after answering
        saveProgress();
    }

    function showFeedback(questionIndex, selectedIndex) {
        optionsContainer.classList.add('options-disabled');
        const correctIndex = quizData.questions[questionIndex].correct;
        
        document.querySelectorAll('.option').forEach((opt, i) => {
            if (i === correctIndex) opt.classList.add('correct');
            else if (i === selectedIndex) opt.classList.add('incorrect');
        });

        const explanationText = quizData.questions[questionIndex].explanation;
        if (explanationText) {
            explanationContainer.innerHTML = `<strong>Explanation:</strong> ${explanationText}`;
            explanationContainer.style.display = 'block';
        }
    }

    function updateNavigation(isAnswered) {
        submitBtn.disabled = !isAnswered;
        updateProgressBar();
    }
    
    function updateProgressBar() {
        const correctCount = totalQuestionsInQuiz - questionQueue.length;
        const progress = (correctCount / totalQuestionsInQuiz) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function showResults() {
        let score = 0;
        userAnswers.forEach((answer, i) => {
            if (answer === quizData.questions[i].correct) score++;
        });
        scoreDisplay.textContent = `Final Score: ${score} out of ${totalQuestionsInQuiz}`;
        quizInterface.style.display = 'none';
        resultsScreen.style.display = 'block';
    }

    function saveProgress() {
        const progress = { userAnswers, questionQueue };
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    // --- 4. BROWSE, REVIEW, AND OTHER FUNCTIONS (UNCHANGED) ---
    // These functions work perfectly with the new system
    function showReview() { /* ... (code remains the same) ... */ }
    function populateBrowseModal() { /* ... (code remains the same) ... */ }
    function showError(message) { /* ... (code remains the same) ... */ }

    // --- 5. EVENT LISTENERS ---
    submitBtn.addEventListener('click', () => {
        if (questionQueue.length > 0) {
            displayQuestion(questionQueue[0]); // Always display the next question in the queue
        } else {
            showResults();
        }
    });
    
    reviewBtn.addEventListener('click', showReview);
    browseBtn.addEventListener('click', () => browseModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => browseModal.classList.add('hidden'));
    browseModal.addEventListener('click', (e) => { if (e.target === browseModal) { browseModal.classList.add('hidden'); } });
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem(storageKey);
        window.location.reload();
    });

    // --- Unchanged Functions (for reference) ---
    function showReview() { resultsScreen.style.display = 'none'; reviewScreen.style.display = 'block'; reviewScreen.innerHTML = '<h2>Quiz Review</h2>'; quizData.questions.forEach((question, index) => { const questionBlock = document.createElement('div'); questionBlock.className = 'review-question-block'; let optionsHTML = ''; question.options.forEach((option, i) => { let className = 'option'; if (i === question.correct) className += ' correct'; else if (i === userAnswers[index]) className += ' incorrect'; optionsHTML += `<div class="${className}">${option}</div>`; }); questionBlock.innerHTML = `<h3>Q${index + 1}: ${question.stem}</h3><div class="options-container">${optionsHTML}</div>${question.explanation ? `<div class="review-explanation"><strong>Explanation:</strong> ${question.explanation}</div>` : ''}`; reviewScreen.appendChild(questionBlock); }); const backBtn = document.createElement('button'); backBtn.textContent = 'Back to Results'; backBtn.className = 'button button-secondary'; backBtn.onclick = () => { reviewScreen.style.display = 'none'; resultsScreen.style.display = 'block'; }; reviewScreen.appendChild(backBtn); }
    function populateBrowseModal() { browseList.innerHTML = ''; quizData.questions.forEach((question, index) => { const item = document.createElement('div'); item.className = 'browse-item'; let optionsHTML = ''; question.options.forEach((optionText, i) => { let className = 'browse-option'; if (i === question.correct) { className += ' correct-answer'; } optionsHTML += `<div class="${className}">${optionText}</div>`; }); item.innerHTML = `<h3 class="browse-question">Q${index + 1}: ${question.stem}</h3>${optionsHTML}<div class="browse-explanation">${question.explanation}</div>`; browseList.appendChild(item); }); }
    function showError(message) { quizInterface.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`; }
});

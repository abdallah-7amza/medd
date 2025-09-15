document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. GET URL PARAMS AND DOM ELEMENTS ---
    // (This section is unchanged and safe)
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const collectionId = urlParams.get('collection');
    const isLessonQuiz = urlParams.has('lessonQuiz');
    const selectedUniId = localStorage.getItem('selectedUni');
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

    // ## START SURGICAL MODIFICATION: New state variables for the smart quiz ##
    let userAnswers = [];
    let quizData = null;
    let storageKey = '';
    let questionQueue = []; // This will hold the indices of questions to be asked
    let currentQuestionIndex = -1; // Will hold the original index of the current question
    let totalQuestions = 0; // To keep track of the initial total
    // ## END SURGICAL MODIFICATION ##

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
            storageKey = `quiz-progress-smart-${path}`;
        } else if (collectionId) {
            const collectionQuiz = currentNode.resources?.collectionQuizzes?.find(q => q.id === collectionId);
            quizData = collectionQuiz?.quizData;
            storageKey = `quiz-progress-smart-${path}-${collectionId}`;
        }
        if (!quizData || !quizData.questions) throw new Error('Quiz data could not be found.');
        
        totalQuestions = quizData.questions.length;
        populateBrowseModal();
        initializeQuiz();

    } catch (error) {
        showError(error.message);
    }

    // --- 3. ALL QUIZ FUNCTIONS (SMART VERSION) ---
    function initializeQuiz() {
        // ## SURGICAL CHANGE: Hide the 'Previous' button ##
        prevBtn.style.display = 'none';

        const savedProgress = localStorage.getItem(storageKey);
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            userAnswers = progress.userAnswers;
            questionQueue = progress.questionQueue;
        } else {
            userAnswers = new Array(totalQuestions).fill(null);
            // Create a queue of all question indices [0, 1, 2, ..., n-1]
            questionQueue = Array.from(Array(totalQuestions).keys());
        }
        
        if (questionQueue.length > 0) {
            displayNextQuestion();
        } else {
            // If the quiz was already completed, show results directly
            showResults();
        }
    }

    function displayNextQuestion() {
        if (questionQueue.length === 0) {
            showResults();
            return;
        }
        // Get and remove the next question index from the front of the queue
        const nextQuestionIndex = questionQueue.shift(); 
        displayQuestion(nextQuestionIndex);
    }

    function displayQuestion(index) {
        currentQuestionIndex = index;
        const question = quizData.questions[index];
        questionCounter.textContent = `Questions Remaining: ${questionQueue.length + 1}`;
        questionStem.textContent = question.stem;
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('options-disabled');
        explanationContainer.style.display = 'none';

        question.options.forEach((option, i) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `<input type="radio" name="answer" value="${i}" id="option-${i}"><label for="option-${i}">${option}</label>`;
            optionElement.addEventListener('click', () => selectOption(i));
            optionsContainer.appendChild(optionElement);
        });
        updateNavigation();
    }

    function selectOption(selectedIndex) {
        if (optionsContainer.classList.contains('options-disabled')) return;
        userAnswers[currentQuestionIndex] = selectedIndex; // Always store answer by its original index
        document.querySelector(`input[value='${selectedIndex}']`).checked = true;
        showFeedback();
        updateNavigation();
    }

    function showFeedback() {
        optionsContainer.classList.add('options-disabled');
        const correctIndex = quizData.questions[currentQuestionIndex].correct;
        const isCorrect = userAnswers[currentQuestionIndex] === correctIndex;

        // ## SURGICAL CORE: The new smart logic ##
        if (!isCorrect) {
            // If incorrect, re-add the question to the queue to be asked again.
            // Insert it randomly somewhere in the second half of the remaining queue.
            const half = Math.ceil(questionQueue.length / 2);
            const randomIndex = Math.floor(Math.random() * (questionQueue.length - half + 1)) + half;
            questionQueue.splice(randomIndex, 0, currentQuestionIndex);
        }
        // ## END SURGICAL CORE ##

        document.querySelectorAll('.option').forEach((opt, i) => {
            if (i === correctIndex) opt.classList.add('correct');
            else if (userAnswers[currentQuestionIndex] === i) opt.classList.add('incorrect');
        });
        
        const explanationText = quizData.questions[currentQuestionIndex].explanation;
        if (explanationText) {
            explanationContainer.innerHTML = `<strong>Explanation:</strong> ${explanationText}`;
            explanationContainer.style.display = 'block';
        }
    }
    
    function saveProgress() {
        const progress = {
            userAnswers: userAnswers,
            questionQueue: questionQueue
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    function updateNavigation() {
        submitBtn.disabled = userAnswers[currentQuestionIndex] === null;
        submitBtn.textContent = 'Next';
        updateProgressBar();
    }
    
    function updateProgressBar() {
        const answeredCorrectlyCount = totalQuestions - questionQueue.length;
        const progress = (answeredCorrectlyCount / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function showResults() {
        let score = 0;
        quizData.questions.forEach((q, i) => {
            if (userAnswers[i] === q.correct) score++;
        });
        scoreDisplay.textContent = `You scored ${score} out of ${totalQuestions}`;
        quizInterface.style.display = 'none';
        resultsScreen.style.display = 'block';
    }
    
    // --- UNTOUCHED FUNCTIONS (These are safe) ---
    function showReview() { /* ... unchanged ... */ }
    function populateBrowseModal() { /* ... unchanged ... */ }
    function showError(message) { /* ... unchanged ... */ }

    // --- EVENT LISTENERS ---
    submitBtn.addEventListener('click', () => {
        saveProgress(); // Save state after every question
        displayNextQuestion();
    });

    // (All other listeners remain unchanged and safe)
    reviewBtn.addEventListener('click', showReview);
    browseBtn.addEventListener('click', () => { browseModal.classList.remove('hidden'); });
    closeModalBtn.addEventListener('click', () => { browseModal.classList.add('hidden'); });
    browseModal.addEventListener('click', (e) => { if (e.target === browseModal) { browseModal.classList.add('hidden'); } });
    resetBtn.addEventListener('click', () => { localStorage.removeItem(storageKey); window.location.reload(); });
});

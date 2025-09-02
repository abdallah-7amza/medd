// docs/js/quiz.js (Final and Complete Version)
document.addEventListener('DOMContentLoaded', async function() {
    // --- GET URL PARAMS AND DOM ELEMENTS ---
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const collectionId = urlParams.get('collection');
    const isLessonQuiz = urlParams.has('lessonQuiz');
    const selectedUniId = localStorage.getItem('selectedUni');

    const siteTitleEl = document.getElementById('site-title');
    const questionCounter = document.getElementById('question-counter');
    const questionStem = document.getElementById('question-stem');
    const optionsContainer = document.getElementById('options-container');
    const submitBtn = document.getElementById('submit-btn');
    const prevBtn = document.getElementById('prev-btn');
    const progressBar = document.getElementById('progress-bar');
    const quizInterface = document.getElementById('quiz-interface');
    const resultsScreen = document.getElementById('results-screen');
    const reviewScreen = document.getElementById('review-screen');
    const scoreDisplay = document.getElementById('score-display');
    const reviewBtn = document.getElementById('review-btn');

    let currentQuestionIndex = 0;
    let userAnswers = [];
    let quizData = null;

    // --- LOAD QUIZ DATA ---
    try {
        if (!selectedUniId || !path) throw new Error("University or Path not specified.");

        const response = await fetch('database.json');
        const data = await response.json();
        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;

        const pathSegments = path.split('/').filter(Boolean).slice(1);
        for (const segment of pathSegments) {
            currentNode = currentNode.children[segment];
        }

        if (isLessonQuiz) {
            quizData = currentNode.resources?.lessonQuiz;
        } else if (collectionId) {
            const collectionQuiz = currentNode.resources?.collectionQuizzes?.find(q => q.id === collectionId);
            quizData = collectionQuiz?.quizData;
        }

        if (!quizData || !quizData.questions) throw new Error('Quiz data could not be found.');

        initializeQuiz();

    } catch (error) {
        showError(error.message);
    }

    // --- QUIZ FUNCTIONS ---
    function initializeQuiz() {
        userAnswers = new Array(quizData.questions.length).fill(null);
        displayQuestion(0);
    }

    function displayQuestion(index) {
        currentQuestionIndex = index;
        const question = quizData.questions[index];
        questionCounter.textContent = `Question ${index + 1} of ${quizData.questions.length}`;
        questionStem.textContent = question.stem;
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('options-disabled');

        question.options.forEach((option, i) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `<input type="radio" name="answer" value="${i}" id="option-${i}"><label for="option-${i}">${option}</label>`;
            if (userAnswers[index] === i) {
                optionElement.querySelector('input').checked = true;
            }
            optionElement.addEventListener('click', () => selectOption(i, question.correct));
            optionsContainer.appendChild(optionElement);
        });
        updateNavigation();
        if (userAnswers[index] !== null) showFeedback(question.correct);
    }

    function selectOption(selectedIndex, correctIndex) {
        if (optionsContainer.classList.contains('options-disabled')) return;
        userAnswers[currentQuestionIndex] = selectedIndex;
        document.querySelector(`input[value='${selectedIndex}']`).checked = true;
        showFeedback(correctIndex);
        updateNavigation();
    }

    function showFeedback(correctIndex) {
        optionsContainer.classList.add('options-disabled');
        document.querySelectorAll('.option').forEach((opt, i) => {
            if (i === correctIndex) opt.classList.add('correct');
            else if (userAnswers[currentQuestionIndex] === i) opt.classList.add('incorrect');
        });
    }

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

    // **THIS IS THE FIX for the review button**
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
                if (i === question.correct) {
                    className += ' correct';
                } else if (i === userAnswers[index]) {
                    className += ' incorrect';
                }
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
        backBtn.className = 'toolbar-button';
        backBtn.onclick = () => {
            reviewScreen.style.display = 'none';
            resultsScreen.style.display = 'block';
        };
        reviewScreen.appendChild(backBtn);
    }
    
    function showError(message) {
        quizInterface.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
    }

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

    reviewBtn.addEventListener('click', showReview); // Correctly attached
});

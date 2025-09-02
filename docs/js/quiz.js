document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const pathSegments = path.split('/').filter(Boolean);
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
    const scoreDisplay = document.getElementById('score-display');

    let currentQuestionIndex = 0;
    let userAnswers = [];
    let quizData = null;

    try {
        if (!selectedUniId || !path) throw new Error("University or Path not specified.");

        const response = await fetch('database.json');
        const data = await response.json();
        let currentNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${currentNode.name} Med Portal`;

        for (const segment of pathSegments.slice(1)) {
            currentNode = currentNode.children[segment];
        }

        if (isLessonQuiz) {
            quizData = currentNode.resources?.lessonQuiz;
        } else if (collectionId) {
            const collectionQuiz = currentNode.resources?.collectionQuizzes?.find(q => q.id === collectionId);
            quizData = collectionQuiz?.quizData;
        }

        if (!quizData || !quizData.questions) throw new Error('Quiz data could not be found or is invalid.');

        initializeQuiz();

    } catch (error) {
        console.error("Quiz Loading Error:", error);
        showError(error.message);
    }

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
            
            optionElement.addEventListener('click', () => selectOption(i, question.correct));
            optionsContainer.appendChild(optionElement);
        });
        updateNavigation();
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
            if (i === correctIndex) {
                opt.classList.add('correct');
            } else if (userAnswers[currentQuestionIndex] === i) {
                opt.classList.add('incorrect');
            }
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
    
    function showError(message) {
        quizInterface.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
    }

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
});

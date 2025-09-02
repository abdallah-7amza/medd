document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const pathSegments = path.split('/').filter(Boolean);

    const pageTitleEl = document.getElementById('page-title');
    const cardContainer = document.getElementById('card-container');
    const siteTitleEl = document.getElementById('site-title');
    const toolbarContainer = document.getElementById('toolbar-container');
    const navContainer = document.getElementById('nav-container');
    const selectedUniId = localStorage.getItem('selectedUni');

    navContainer.innerHTML = '<a href="javascript:history.back()" class="back-link">← Back</a>';

    if (!selectedUniId) {
        pageTitleEl.textContent = 'No University Selected.';
        return;
    }

    try {
        const response = await fetch('./database.json');
        const data = await response.json();
        const university = data.tree[selectedUniId];
        siteTitleEl.textContent = `${university.name} Med Portal`;

        let currentNode = university;
        for (const segment of pathSegments.slice(1)) {
            currentNode = currentNode.children[segment];
        }

        pageTitleEl.textContent = currentNode.label || currentNode.name;
        cardContainer.innerHTML = '';
        toolbarContainer.innerHTML = '';

        // Display Collection Quizzes
        if (currentNode.resources?.collectionQuizzes) {
            currentNode.resources.collectionQuizzes.forEach(quiz => {
                const quizButton = document.createElement('a');
                quizButton.href = `quiz.html?collection=${quiz.id}&path=${path}`;
                quizButton.className = 'card';
                quizButton.innerHTML = `<h2>Start ${quiz.title}</h2>`;
                toolbarContainer.appendChild(quizButton);
            });
        }
        
        // ### START: NEW CODE FOR FLASHCARDS ###
        // Display Flashcard Decks
        if (currentNode.resources?.flashcardDecks) {
            currentNode.resources.flashcardDecks.forEach(deck => {
                const deckButton = document.createElement('a');
                // We reuse the 'collection' URL parameter for simplicity to pass the deck ID
                deckButton.href = `flashcards.html?collection=${deck.id}&path=${path}`;
                deckButton.className = 'card'; // Display it like other main cards
                deckButton.innerHTML = `<h2><i class="fa-solid fa-layer-group"></i> Start Flashcards: ${deck.title}</h2>`;
                toolbarContainer.appendChild(deckButton);
            });
        }
        // ### END: NEW CODE FOR FLASHCARDS ###

        // Display Child Nodes (Branches or Lessons)
        if (currentNode.children) {
            for (const id in currentNode.children) {
                const childNode = currentNode.children[id];
                const newPath = `${path}/${id}`;
                const isBranch = childNode.children && Object.keys(childNode.children).length > 0;
                
                let targetUrl;
                let showLessonQuizButton = false;

                if (isBranch) {
                    targetUrl = `lessons-list.html?path=${newPath}`;
                } else if (childNode.hasIndex) {
                    targetUrl = `lesson.html?path=${newPath}`;
                    if (childNode.resources?.lessonQuiz) {
                        showLessonQuizButton = true;
                    }
                } else if (childNode.resources?.lessonQuiz) {
                    targetUrl = `quiz.html?lessonQuiz=true&path=${newPath}`;
                } else {
                    targetUrl = '#'; 
                }

                const card = createCard(childNode.label, targetUrl, childNode.summary || '');

                if (showLessonQuizButton) {
                    const lessonQuizBtn = document.createElement('a');
                    lessonQuizBtn.href = `quiz.html?lessonQuiz=true&path=${newPath}`;
                    lessonQuizBtn.textContent = "Start Lesson Quiz";
                    lessonQuizBtn.className = 'lesson-quiz-button';
                    lessonQuizBtn.addEventListener('click', (e) => e.stopPropagation());
                    card.appendChild(lessonQuizBtn);
                }

                cardContainer.appendChild(card);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        pageTitleEl.textContent = 'Error loading data.';
    }
});

function createCard(title, url, description = '') {
    const cardLink = document.createElement('a');
    cardLink.href = url;
    cardLink.className = 'card';
    
    let content = `<div class="card-content"><h2>${title}</h2>`;
    if (url.includes('quiz.html') && !description) {
        content += `<p>A set of questions to test your knowledge on this topic.</p>`;
    } else if (description) {
        content += `<p>${description}</p>`;
    }
    content += `</div>`;
    cardLink.innerHTML = content;

    if (url === '#') {
        cardLink.classList.add('disabled');
    }
    return cardLink;
}

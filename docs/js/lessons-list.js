// docs/js/lessons-list.js (Corrected Version)
document.addEventListener('DOMContentLoaded', async function() {
    // ... (rest of the initial variables are the same)
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    // ...

    try {
        // ... (rest of the data fetching is the same)
        const response = await fetch('database.json');
        const data = await response.json();
        // ...

        // **THIS IS THE FIX for the quiz button name**
        if (currentNode.resources?.collectionQuizzes) {
            currentNode.resources.collectionQuizzes.forEach(quiz => {
                const quizButton = document.createElement('a');
                quizButton.href = `quiz.html?collection=${quiz.id}&path=${path}`;
                quizButton.className = 'card';
                // Use the quiz's own title, not the page's title
                quizButton.innerHTML = `<h2>Start ${quiz.title}</h2>`; 
                toolbarContainer.appendChild(quizButton);
            });
        }

        // ... (rest of the code for displaying children remains the same)
        if (currentNode.children) {
            for (const id in currentNode.children) {
                const childNode = currentNode.children[id];
                const newPath = `${path}/${id}`;
                const isBranch = childNode.children && Object.keys(childNode.children).length > 0;
                
                const targetUrl = isBranch || !childNode.hasIndex
                    ? `lessons-list.html?path=${newPath}`
                    : `lesson.html?path=${newPath}`;

                const card = createCard(childNode.label, targetUrl, childNode.summary || '');

                if (childNode.resources?.lessonQuiz) {
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
        // ... (error handling is the same)
    }
});

// ... (function createCard remains the same)
function createCard(title, url, description = '') {
    const cardLink = document.createElement('a');
    cardLink.href = url;
    cardLink.className = 'card';
    cardLink.innerHTML = `<h2>${title}</h2>${description ? `<p>${description}</p>` : ''}`;
    return cardLink;
}

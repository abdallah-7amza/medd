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

    // Display the "Loading..." message initially
    pageTitleEl.textContent = 'Loading...';

    // Add back button
    navContainer.innerHTML = '<a href="javascript:history.back()" class="back-link">← Back</a>';

    if (!selectedUniId) {
        pageTitleEl.textContent = 'Error: No University Selected. Please go back to the homepage.';
        return;
    }

    try {
        // The fetch path must be relative to the HTML file (e.g., /docs/lessons-list.html)
        // So, 'database.json' or './database.json' is correct.
        const response = await fetch('./database.json'); 
        if (!response.ok) {
            throw new Error(`Failed to load database.json. Status: ${response.status}`);
        }
        const data = await response.json();
        const university = data.tree[selectedUniId];

        if (!university) {
            throw new Error('Selected university not found in the database.');
        }
        
        siteTitleEl.textContent = `${university.name} Med Portal`;

        let currentNode = university;
        // Navigate to the correct node using the path, skipping the university ID itself
        for (const segment of pathSegments.slice(1)) {
            if (currentNode && currentNode.children && currentNode.children[segment]) {
                currentNode = currentNode.children[segment];
            } else {
                throw new Error('Path not found in database tree.');
            }
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
                quizButton.innerHTML = `<h2>Start ${quiz.title || currentNode.label}</h2>`;
                toolbarContainer.appendChild(quizButton);
            });
        }

        // Display Child Nodes (Branches or Lessons)
        if (currentNode.children && Object.keys(currentNode.children).length > 0) {
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
        } else if (!currentNode.hasIndex) {
            cardContainer.innerHTML = '<p>No topics available in this section.</p>';
        }

    } catch (error) {
        console.error('Critical Error:', error);
        pageTitleEl.textContent = `Error: ${error.message}`;
        pageTitleEl.style.color = 'red';
    }
});

function createCard(title, url, description = '') {
    const cardLink = document.createElement('a');
    cardLink.href = url;
    cardLink.className = 'card';
    cardLink.innerHTML = `<h2>${title}</h2>${description ? `<p>${description}</p>` : ''}`;
    return cardLink;
}

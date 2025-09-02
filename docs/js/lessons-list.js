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

        // Display Collection Quizzes and Flashcards for the BRANCH
        if (currentNode.resources?.collectionQuizzes) {
            currentNode.resources.collectionQuizzes.forEach(quiz => {
                const quizButton = createResourceButton(`Start ${quiz.title}`, `quiz.html?collection=${quiz.id}&path=${path}`);
                toolbarContainer.appendChild(quizButton);
            });
        }
        if (currentNode.resources?.flashcardDecks) {
            currentNode.resources.flashcardDecks.forEach(deck => {
                const deckButton = createResourceButton(`Start Flashcards: ${deck.title}`, `flashcards.html?collection=${deck.id}&path=${path}`);
                toolbarContainer.appendChild(deckButton);
            });
        }

        // Display a single card for each child TOPIC
        if (currentNode.children) {
            for (const id in currentNode.children) {
                const childNode = currentNode.children[id];
                const newPath = `${path}/${id}`;
                
                // The card ALWAYS links to lesson.html now, which acts as the topic page
                const targetUrl = `lesson.html?path=${newPath}`;
                
                const card = createCard(childNode.label, targetUrl, childNode.summary || 'Click to see available content and resources.');
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
    cardLink.innerHTML = `<div class="card-content"><h2>${title}</h2><p>${description}</p></div>`;
    return cardLink;
}

function createResourceButton(text, url) {
    const button = document.createElement('a');
    button.href = url;
    button.className = 'card'; // Use card style for a consistent look
    button.innerHTML = `<h2>${text}</h2>`;
    return button;
}

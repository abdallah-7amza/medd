document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = (urlParams.get('path') || '').replace(/^\/+|\/+$/g, ''); // Sanitize path
    const pathSegments = path.split('/').filter(Boolean);

    const pageTitleEl = document.getElementById('page-title');
    const cardContainer = document.getElementById('card-container');
    const siteTitleEl = document.getElementById('site-title');
    const toolbarContainer = document.getElementById('toolbar-container');
    const navContainer = document.getElementById('nav-container');
    const selectedUniId = localStorage.getItem('selectedUni');

    navContainer.innerHTML = '<a href="javascript:history.back()" class="back-link">← Back</a>';

    if (!selectedUniId) {
        if (pageTitleEl) pageTitleEl.textContent = 'No University Selected.';
        return;
    }

    try {
        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();
        const university = data.tree[selectedUniId];
        siteTitleEl.textContent = `${university.name} Med Portal`;

        let currentNode = university;
        
        // --- START: THE CRITICAL FIX for navigation ---
        let cleanPathSegments = [...pathSegments];
        if (cleanPathSegments.length > 0 && cleanPathSegments[0] === selectedUniId) {
            cleanPathSegments.shift(); // Remove university ID if present
        }
        for (const segment of cleanPathSegments) {
            if (currentNode?.children?.[segment]) {
                currentNode = currentNode.children[segment];
            } else {
                throw new Error(`Path segment "${segment}" not found.`);
            }
        }
        // --- END: THE CRITICAL FIX ---

        // KEPT: Your good idea to hide the title on the first level
        if (pageTitleEl) {
            if (pathSegments.length <= 1) {
                pageTitleEl.style.display = 'none';
            } else {
                pageTitleEl.style.display = 'block';
                pageTitleEl.textContent = currentNode.label || currentNode.name;
            }
        }

        cardContainer.innerHTML = '';
        toolbarContainer.innerHTML = '';

        if (currentNode.resources) {
            if (currentNode.resources.collectionQuizzes) {
                currentNode.resources.collectionQuizzes.forEach(quiz => {
                    toolbarContainer.appendChild(createResourceButton(quiz.title, `quiz.html?collection=${quiz.id}&path=${path}`, 'quiz'));
                });
            }
            if (currentNode.resources.flashcardDecks) {
                currentNode.resources.flashcardDecks.forEach(deck => {
                    toolbarContainer.appendChild(createResourceButton(deck.title, `flashcards.html?collection=${deck.id}&path=${path}`, 'flashcards'));
                });
            }
        }

        if (currentNode.children) {
            for (const id in currentNode.children) {
                const childNode = currentNode.children[id];
                // KEPT & FIXED: Build the new path safely
                const newPath = path ? `${path}/${id}` : id;
                
                // FIXED: Calculate isBranch on the fly
                const isBranch = childNode.children && Object.keys(childNode.children).length > 0;
                
                const targetUrl = isBranch
                    ? `lessons-list.html?path=${newPath}`
                    : `lesson.html?path=${newPath}`;
                
                const card = createCard(childNode.label, targetUrl, childNode.summary);
                cardContainer.appendChild(card);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        if(pageTitleEl) pageTitleEl.textContent = `Error: ${error.message}`;
    }
});

// FIXED: Re-added the description to the card's innerHTML
function createCard(title, url, description) {
    const cardLink = document.createElement('a');
    cardLink.href = url;
    cardLink.className = 'card card--lesson';
    cardLink.innerHTML = `<div class="card-content"><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}</div>`;
    return cardLink;
}

// KEPT: Your good idea for dynamic resource classes
function createResourceButton(text, url, type) {
    const button = document.createElement('a');
    button.href = url;
    button.className = `card card--${type}`;
    button.innerHTML = `<h2>${text}</h2>`;
    return button;
}

// docs/js/lessons-list.js (Final Version)
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    let path = urlParams.get('path') || '';
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
        const response = await fetch('database.json');
        const data = await response.json();
        const university = data.tree[selectedUniId];
        siteTitleEl.textContent = `${university.name} Med Portal`;
        
        let currentNode = university;
        for (const segment of pathSegments) {
            currentNode = currentNode.children[segment];
        }

        pageTitleEl.textContent = currentNode.label || 'Select a topic';
        cardContainer.innerHTML = '';
        toolbarContainer.innerHTML = '';

        if (currentNode.resources?.collectionQuizzes) {
            currentNode.resources.collectionQuizzes.forEach(quiz => {
                const quizButton = document.createElement('a');
                quizButton.href = `quiz.html?collection=${quiz.id}&path=${path}`;
                quizButton.className = 'card';
                quizButton.innerHTML = `<h2>Start ${currentNode.label} Quiz Bank</h2>`;
                toolbarContainer.appendChild(quizButton);
            });
        }

        if (currentNode.children) {
            for (const id in currentNode.children) {
                const childNode = currentNode.children[id];
                const newPath = path ? `${path}/${id}` : id;
                const hasChildren = childNode.children && Object.keys(childNode.children).length > 0;
                
                const targetUrl = hasChildren || !childNode.hasIndex
                    ? `lessons-list.html?path=${newPath}`
                    : `lesson.html?path=${newPath}`;

                const card = createCard(childNode.label, targetUrl, childNode.summary || '');
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
    cardLink.innerHTML = `<h2>${title}</h2>${description ? `<p>${description}</p>` : ''}`;
    return cardLink;
}

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const pathSegments = path.split('/').filter(Boolean);

    const pageTitleEl = document.getElementById('page-title');
    const cardContainer = document.getElementById('card-container');
    const siteTitleEl = document.getElementById('site-title');
    const toolbarContainer = document.getElementById('toolbar-container');
    const navContainer = document.getElementById('nav-container');
    
    // Path to the university name is now dynamic
    const uniId = pathSegments[0]; 

    navContainer.innerHTML = '<a href="javascript:history.back()" class="back-link">← Back</a>';

    if (!uniId) {
        if (pageTitleEl) pageTitleEl.textContent = 'No University Selected.';
        return;
    }
    
    // This is our new, surgically precise data fetching function
    async function getData(url, cacheKey) {
        const versionResponse = await fetch('content/version.json');
        if (!versionResponse.ok) throw new Error('Version file not found.');
        const rootVersions = (await versionResponse.json()).versions;
        
        const latestVersion = rootVersions[uniId];

        const cachedVersion = localStorage.getItem(`${cacheKey}-version`);
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData && cachedVersion === latestVersion) {
            console.log(`Loaded from cache: ${cacheKey}`);
            return JSON.parse(cachedData);
        } else {
            console.log(`Fetching from network: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(`${cacheKey}-version`, latestVersion);
            return data;
        }
    }

    try {
        const dataPath = `content/${path}/meta.json`;
        const cacheKey = `cached-data-${path}`;
        const currentNode = await getData(dataPath, cacheKey);

        siteTitleEl.textContent = `${currentNode.name} Med Portal`;

        if (pageTitleEl) {
            if (pathSegments.length < 1) { // Adjusted logic for root
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
                const newPath = `${path}/${id}`;
                
                const targetUrl = childNode.isBranch
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

function createCard(title, url, description) {
    const cardLink = document.createElement('a');
    cardLink.href = url;
    cardLink.className = 'card card--lesson';
    cardLink.innerHTML = `<div class="card-content"><h2>${title}</h2></div>`;
    return cardLink;
}

function createResourceButton(text, url, type) {
    const button = document.createElement('a');
    button.href = url;
    button.className = `card card--${type}`;
    button.innerHTML = `<h2>${text}</h2>`;
    return button;
}

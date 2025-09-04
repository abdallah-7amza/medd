document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const pathSegments = path.split('/').filter(Boolean);
    const selectedUniId = localStorage.getItem('selectedUni');

    const pageTitleEl = document.getElementById('page-title');
    const contentContainer = document.getElementById('content-container');
    const siteTitleEl = document.getElementById('site-title');
    const toolbarContainer = document.getElementById('toolbar-container');

    if (!selectedUniId || !path) {
        pageTitleEl.textContent = 'Invalid parameters.'; return;
    }

    try {
        const response = await fetch('./database.json');
        if (!response.ok) throw new Error("Database file not found.");
        const data = await response.json();
        let topicNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${topicNode.name} Med Portal`;

        for (const segment of pathSegments.slice(1)) {
            topicNode = topicNode.children[segment];
        }

        if (!topicNode) throw new Error("Topic not found in database.");

        pageTitleEl.textContent = topicNode.label;
        toolbarContainer.innerHTML = '';

        // **UPDATED**: This section now calls the new button creation function with the correct types
        if (topicNode.resources) {
            if (topicNode.resources.collectionQuizzes) {
                topicNode.resources.collectionQuizzes.forEach(quiz => {
                    toolbarContainer.appendChild(createResourceButton(quiz.title, `quiz.html?collection=${quiz.id}&path=${path}`, 'quiz'));
                });
            }
            if (topicNode.resources.lessonQuiz) {
                toolbarContainer.appendChild(createResourceButton(`Start Quiz`, `quiz.html?lessonQuiz=true&path=${path}`, 'quiz'));
            }
            if (topicNode.resources.flashcardDecks) {
                topicNode.resources.flashcardDecks.forEach(deck => {
                    toolbarContainer.appendChild(createResourceButton(deck.title, `flashcards.html?collection=${deck.id}&path=${path}`, 'flashcards'));
                });
            }
        }

        if (topicNode.hasIndex) {
            contentContainer.innerHTML = marked.parse(topicNode.markdownContent);
        } else {
            contentContainer.innerHTML = "<p>No detailed lesson is available for this topic, but you can use the resources above.</p>";
        }

    } catch (error) {
        console.error('Error:', error);
        pageTitleEl.textContent = `Error: ${error.message}`;
    }
});

// **UPDATED**: This function now creates cards with the correct visual identity
function createResourceButton(text, url, type) {
    const button = document.createElement('a');
    button.href = url;
    // Applies the correct class (e.g., 'card--quiz') for consistent styling
    button.className = `card card--${type}`;
    button.innerHTML = `<h2>${text}</h2>`;
    return button;
}

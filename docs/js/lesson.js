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
        const data = await response.json();
        let topicNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${topicNode.name} Med Portal`;

        for (const segment of pathSegments.slice(1)) {
            topicNode = topicNode.children[segment];
        }

        pageTitleEl.textContent = topicNode.label;
        toolbarContainer.innerHTML = ''; // Clear toolbar

        // ** THIS IS THE NEW LOGIC **
        // Check for a lesson-specific quiz
        if (topicNode.resources?.lessonQuiz) {
            const quizButton = createResourceButton(`Start Quiz`, `quiz.html?lessonQuiz=true&path=${path}`);
            toolbarContainer.appendChild(quizButton);
        }

        // Check for flashcard decks related to this lesson
        if (topicNode.resources?.flashcardDecks) {
            topicNode.resources.flashcardDecks.forEach(deck => {
                const deckButton = createResourceButton(`Start Flashcards: ${deck.title}`, `flashcards.html?collection=${deck.id}&path=${path}`);
                toolbarContainer.appendChild(deckButton);
            });
        }

        // Display the main lesson content, if it exists
        if (topicNode.hasIndex) {
            contentContainer.innerHTML = marked.parse(topicNode.markdownContent);
        } else {
            contentContainer.innerHTML = "<p>No detailed lesson text is available for this topic, but you can use the resources above.</p>";
        }

    } catch (error) {
        console.error('Error:', error);
        pageTitleEl.textContent = 'Error loading topic.';
    }
});

function createResourceButton(text, url) {
    const button = document.createElement('a');
    button.href = url;
    button.className = 'button button-primary'; // Using the attractive button style
    button.textContent = text;
    return button;
}

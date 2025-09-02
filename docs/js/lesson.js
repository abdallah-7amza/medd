document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const pathSegments = path.split('/').filter(Boolean);
    const selectedUniId = localStorage.getItem('selectedUni');

    const pageTitleEl = document.getElementById('page-title');
    const contentContainer = document.getElementById('content-container');
    const siteTitleEl = document.getElementById('site-title');

    if (!selectedUniId || !path) {
        pageTitleEl.textContent = 'Invalid parameters.'; return;
    }

    try {
        const response = await fetch('../database.json'); // Corrected path for nested HTML file
        const data = await response.json();
        let lessonNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${lessonNode.name} Med Portal`;

        // Navigate through the path to find the correct lesson node
        for (const segment of pathSegments.slice(1)) { // Skip the first segment (university ID)
            if (lessonNode && lessonNode.children) {
                lessonNode = lessonNode.children[segment];
            } else {
                lessonNode = null;
                break;
            }
        }

        if (lessonNode?.hasIndex) {
            pageTitleEl.textContent = lessonNode.label;
            // Use marked.js library (included in lesson.html) to parse Markdown
            if (window.marked) {
                contentContainer.innerHTML = marked.parse(lessonNode.markdownContent);
            } else {
                // Fallback for simple text display if marked.js is not loaded
                contentContainer.innerHTML = lessonNode.markdownContent.replace(/\n/g, '<br>');
            }
        } else {
            pageTitleEl.textContent = 'Content Not Found';
            contentContainer.innerHTML = '<p>No content is available for this topic. It might be a category containing other lessons.</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        pageTitleEl.textContent = 'Error loading lesson.';
    }
});

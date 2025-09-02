document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const path = urlParams.get('path') || '';
    const pathSegments = path.split('/').filter(Boolean);
    const selectedUniId = localStorage.getItem('selectedUni');
    const pageTitleEl = document.getElementById('page-title');
    const contentContainer = document.getElementById('content-container');
    const siteTitleEl = document.getElementById('site-title');
    if (!selectedUniId || !path) {
        pageTitleEl.textContent = 'Error: Missing information in URL.'; return;
    }
    try {
        const response = await fetch('database.json');
        const data = await response.json();
        let lessonNode = data.tree[selectedUniId];
        siteTitleEl.textContent = `${lessonNode.name} Med Portal`;
        for (const segment of pathSegments.slice(1)) {
            lessonNode = lessonNode.children[segment];
        }
        if (lessonNode?.hasIndex) {
            pageTitleEl.textContent = lessonNode.label;
            contentContainer.innerHTML = marked.parse(lessonNode.markdownContent);
        } else {
            pageTitleEl.textContent = 'Content Not Found';
        }
    } catch (error) {
        console.error('Error:', error);
        pageTitleEl.textContent = 'Error loading lesson.';
    }
});

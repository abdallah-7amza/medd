/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const contentKey = 'contentData';

async function loadAndDisplayLesson() {
  const urlParams = new URLSearchParams(window.location.search);
  const currentPath = urlParams.get('path');

  if (!currentPath) {
    document.body.innerHTML = '<p>Error: No path specified.</p>';
    return;
  }

  const cachedVersion = JSON.parse(localStorage.getItem('contentVersion'));
  const folderHash = cachedVersion.hashes[currentPath.split('/').slice(-1)[0]];

  const folderContent = await loadContent(currentPath, folderHash);

  if (folderContent && folderContent.hasIndex) {
    document.getElementById('page-title').textContent = folderContent.label;
    const lessonContentDiv = document.getElementById('lesson-content');
    
    // Check if markdown content is available directly in the meta.json
    if (folderContent.markdownContent) {
      lessonContentDiv.innerHTML = folderContent.markdownContent;
    } else {
      // Fallback if content is not pre-loaded (e.g., from an older cache version)
      // This part is for robustness, as new workflow ensures markdown is in meta.json
      lessonContentDiv.innerHTML = '<p>Failed to load lesson content.</p>';
    }
  } else {
    document.body.innerHTML = '<p>Error: Lesson not found.</p>';
  }
}

async function loadContent(path, hash) {
  const cachedContent = localStorage.getItem(contentKey);
  let contentData = cachedContent ? JSON.parse(cachedContent) : {};
  const currentHash = contentData.hashes?.[path];

  if (currentHash === hash && contentData.data?.[path]) {
    return contentData.data[path];
  }

  const contentUrl = `${path}/meta.json`;
  try {
    const response = await fetch(contentUrl);
    if (!response.ok) throw new Error('Network response was not ok.');
    const newContent = await response.json();
    
    contentData.hashes = contentData.hashes || {};
    contentData.data = contentData.data || {};
    contentData.hashes[path] = hash;
    contentData.data[path] = newContent;
    localStorage.setItem(contentKey, JSON.stringify(contentData));
    
    return newContent;
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return null;
  }
}

loadAndDisplayLesson();

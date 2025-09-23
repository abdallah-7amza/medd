/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const contentPath = '../content/universities/nub';
const versionFile = '../docs/version.json';
const contentKey = 'contentData';

async function loadAndDisplayLessons() {
  const urlParams = new URLSearchParams(window.location.search);
  const currentPath = urlParams.get('path');

  if (!currentPath) {
    document.body.innerHTML = '<p>Error: No path specified.</p>';
    return;
  }

  const cachedVersion = JSON.parse(localStorage.getItem('contentVersion'));
  const folderHash = cachedVersion.hashes[currentPath.split('/').slice(-1)[0]];

  const folderContent = await loadContent(currentPath, folderHash);

  if (folderContent) {
    document.getElementById('page-title').textContent = folderContent.label;
    const lessonsList = document.getElementById('lessons-list');
    const quizzesList = document.getElementById('quizzes-list');
    const flashcardsList = document.getElementById('flashcards-list');

    // Display sub-branches/lessons
    if (folderContent.children) {
      Object.entries(folderContent.children).forEach(([childName, childNode]) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `lessons-list.html?path=${currentPath}/${childName}`;
        a.textContent = childNode.label;
        li.appendChild(a);
        lessonsList.appendChild(li);
      });
    }

    // Display quizzes
    if (folderContent.resources?.collectionQuizzes) {
      folderContent.resources.collectionQuizzes.forEach(quiz => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `quiz.html?path=${currentPath}/_collection_quiz/${quiz.id}`;
        a.textContent = quiz.title;
        li.appendChild(a);
        quizzesList.appendChild(li);
      });
    }

    // Display flashcards
    if (folderContent.resources?.flashcardDecks) {
      folderContent.resources.flashcardDecks.forEach(deck => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `flashcards.html?path=${currentPath}/_flashcards/${deck.id}`;
        a.textContent = deck.title;
        li.appendChild(a);
        flashcardsList.appendChild(li);
      });
    }
  } else {
    document.body.innerHTML = '<p>Error: Failed to load lessons.</p>';
  }
}

// Re-using the same cache function from index.js
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

loadAndDisplayLessons();

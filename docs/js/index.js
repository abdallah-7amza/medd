/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const contentPath = '../content/universities/nub';
const versionFile = '../docs/version.json';
const databaseFile = '../docs/database.json';

const versionKey = 'contentVersion';
const contentKey = 'contentData';

async function fetchAndCacheVersion() {
  try {
    const response = await fetch(versionFile);
    if (!response.ok) throw new Error('Network response was not ok.');
    const versionData = await response.json();
    localStorage.setItem(versionKey, JSON.stringify(versionData));
    return versionData;
  } catch (error) {
    console.error('Failed to fetch version file:', error);
    return null;
  }
}

async function loadContent(path, hash) {
  const cachedContent = localStorage.getItem(contentKey);
  let contentData = cachedContent ? JSON.parse(cachedContent) : {};
  const currentHash = contentData.hashes?.[path];

  // If hash matches or content is already in cache, return from cache
  if (currentHash === hash && contentData.data?.[path]) {
    return contentData.data[path];
  }

  // If not in cache or hash is different, fetch new content
  const contentUrl = `${path}/meta.json`;
  try {
    const response = await fetch(contentUrl);
    if (!response.ok) throw new Error('Network response was not ok.');
    const newContent = await response.json();
    
    // Update the cache
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

async function initializeApp() {
  const versionData = await fetchAndCacheVersion();
  if (!versionData) {
    // Fallback or error handling
    document.getElementById('university-list').innerHTML = '<p>Failed to load app data. Please try again later.</p>';
    return;
  }

  const universityDirName = 'nub'; // This should be dynamic in a multi-university setup
  const universityPath = `${contentPath}`;
  const universityHash = versionData.hashes[universityDirName];
  
  const universityContent = await loadContent(universityPath, universityHash);
  if (universityContent) {
    const university = { name: universityDirName, ...universityContent };
    const universityList = document.getElementById('university-list');
    
    if (university.children) {
      Object.entries(university.children).forEach(([childName, childNode]) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `lessons-list.html?path=${universityPath}/${childName}`;
        a.textContent = childNode.label;
        li.appendChild(a);
        universityList.appendChild(li);
      });
    }
  }
}

initializeApp();

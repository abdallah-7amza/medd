document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const yearId = urlParams.get('year');
    const specialtyId = urlParams.get('specialty');
    const selectedUniId = localStorage.getItem('selectedUni');
    const pageTitleEl = document.getElementById('page-title');
    const cardContainer = document.getElementById('card-container');
    const siteTitleEl = document.getElementById('site-title');
    
    if (!selectedUniId) {
        pageTitleEl.textContent = 'No University Selected.';
        return;
    }
    
    try {
        const response = await fetch('database.json');
        if (!response.ok) throw new Error('Failed to load database.');
        const data = await response.json();
        const university = data.tree[selectedUniId];
        
        if (!university) {
            pageTitleEl.textContent = 'University not found.';
            return;
        }
        
        siteTitleEl.textContent = `${university.name} Med Portal`;
        cardContainer.innerHTML = '';
        
        if (!yearId) {
            // Display Years
            pageTitleEl.textContent = 'Academic Years';
            for (const id in university.children) {
                const year = university.children[id];
                const card = createCard(year.label, `lessons-list.html?year=${id}`);
                cardContainer.appendChild(card);
            }
        } else if (yearId && !specialtyId) {
            // Display Specialties
            const year = university.children[yearId];
            if (!year) { 
                pageTitleEl.textContent = 'Year not found.'; 
                return; 
            }
            
            pageTitleEl.textContent = `Specialties in ${year.label}`;
            for (const id in year.children) {
                const specialty = year.children[id];
                const card = createCard(specialty.label, `lessons-list.html?year=${yearId}&specialty=${id}`);
                cardContainer.appendChild(card);
            }
        } else if (yearId && specialtyId) {
            // Display Lessons
            const year = university.children[yearId];
            const specialty = year ? year.children[specialtyId] : null;
            
            if (!specialty) { 
                pageTitleEl.textContent = 'Specialty not found.'; 
                return; 
            }
            
            pageTitleEl.textContent = `Lessons in ${specialty.label}`;
            
            for (const id in specialty.children) {
                const lesson = specialty.children[id];
                const description = lesson.summary || '';
                const card = createCard(lesson.label, `lesson.html?year=${yearId}&specialty=${specialtyId}&lesson=${id}`, description);
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
    
    let content = `<h2>${title}</h2>`;
    if (description) {
        content += `<p>${description}</p>`;
    }
    
    cardLink.innerHTML = content;
    return cardLink;
}

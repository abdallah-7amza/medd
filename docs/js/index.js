document.addEventListener('DOMContentLoaded', async function() {
    const cardContainer = document.getElementById('universities-container');
    if (!cardContainer) return;

    cardContainer.innerHTML = '<div>Loading universities...</div>';

    try {
        // Fetch the root version file, which contains the latest version for each university
        const versionResponse = await fetch('content/version.json');
        if (!versionResponse.ok) throw new Error('Version file not found.');
        const rootVersions = (await versionResponse.json()).versions;

        // Use the overall root version hash for the list of universities itself
        const mainVersion = rootVersions['nub']; // Assuming 'nub' is the main key
        const cacheKey = 'cached-universities-list';
        const cachedVersionKey = 'cached-universities-list-version';
        const cachedData = localStorage.getItem(cacheKey);
        const cachedVersion = localStorage.getItem(cachedVersionKey);

        let universitiesData;

        // Check if the cached version matches the latest version
        if (cachedData && cachedVersion === mainVersion) {
            universitiesData = JSON.parse(cachedData);
            console.log('University list loaded from cache.');
        } else {
            console.log('Fetching new university list from network.');
            // Fetch only the metadata for the main university node
            const response = await fetch('content/nub/meta.json');
            if (!response.ok) throw new Error('Failed to load main university data.');
            universitiesData = { nub: await response.json() }; // Structure it like the original tree
            
            localStorage.setItem(cacheKey, JSON.stringify(universitiesData));
            localStorage.setItem(cachedVersionKey, mainVersion);
        }

        cardContainer.innerHTML = ''; // Clear loading message

        if (!universitiesData || Object.keys(universitiesData).length === 0) {
            cardContainer.innerHTML = '<div>No universities found.</div>';
            return;
        }

        // Render the universities from the (now very small) data
        for (const uniId in universitiesData) {
            const university = universitiesData[uniId];
            const card = document.createElement('a');
            // The path now starts from the university ID
            card.href = `lessons-list.html?path=${uniId}`; 
            card.className = 'card';
            card.innerHTML = `<h2>${university.name}</h2>`;

            card.addEventListener('click', function(event) {
                event.preventDefault(); 
                // We no longer need to save the selected Uni ID as it's in the path
                window.location.href = card.href;
            });

            cardContainer.appendChild(card);
        }
    } catch (error) {
        console.error('Error:', error);
        cardContainer.innerHTML = '<div>Error loading universities. Please try again later.</div>';
    }
});

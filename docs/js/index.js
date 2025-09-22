document.addEventListener('DOMContentLoaded', async function() {
    const cardContainer = document.getElementById('universities-container');
    if (!cardContainer) return;

    cardContainer.innerHTML = '<div>Loading universities...</div>';

    try {
        // Fetch the root version file, which contains the university IDs and their latest versions
        const versionResponse = await fetch('content/version.json');
        if (!versionResponse.ok) throw new Error('Version file not found.');
        const { versions } = await versionResponse.json();

        cardContainer.innerHTML = ''; // Clear loading message

        if (!versions || Object.keys(versions).length === 0) {
            cardContainer.innerHTML = '<div>No universities found.</div>';
            return;
        }

        // We need to fetch the name for each university from its own meta file
        for (const uniId in versions) {
            // Asynchronously fetch each university's metadata to get its name
            fetch(`content/${uniId}/meta.json`)
                .then(response => {
                    if (!response.ok) throw new Error(`Could not load metadata for ${uniId}`);
                    return response.json();
                })
                .then(uniData => {
                    const card = document.createElement('a');
                    card.href = `lessons-list.html?path=${uniId}`;
                    card.className = 'card';
                    // Use the fetched name
                    card.innerHTML = `<h2>${uniData.name}</h2>`; 

                    card.addEventListener('click', function(event) {
                        event.preventDefault();
                        // Save the selected university ID to be used by other pages
                        localStorage.setItem('selectedUni', uniId); 
                        window.location.href = card.href;
                    });
                    cardContainer.appendChild(card);
                })
                .catch(error => {
                    console.error('Error loading a university card:', error);
                    const errorCard = document.createElement('div');
                    errorCard.className = 'card';
                    errorCard.innerHTML = `<h2>Error loading: ${uniId}</h2>`;
                    cardContainer.appendChild(errorCard);
                });
        }

    } catch (error) {
        console.error('Error:', error);
        cardContainer.innerHTML = '<div>Error loading universities. Please try again later.</div>';
    }
});

// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsContainer = document.getElementById('searchResults');
    const videoPlayerSection = document.getElementById('videoPlayerSection');
    const videoTitleElement = document.getElementById('videoTitle');
    const playerWrapper = document.getElementById('playerWrapper');
    const episodeListElement = document.getElementById('episodeList').querySelector('.episodes');
    const closePlayerButton = document.getElementById('closePlayerButton');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const currentYearElement = document.getElementById('currentYear');

    // --- State ---
    let currentAnimeData = null; // To store details of the currently selected anime
    let currentEpisodeLink = null; // To store the active episode link

    // --- Initialization ---
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // --- Event Listeners ---
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    closePlayerButton.addEventListener('click', hideVideoPlayer);

    // Use event delegation for dynamically added anime cards and episode links
    searchResultsContainer.addEventListener('click', handleResultClick);
    episodeListElement.addEventListener('click', handleEpisodeClick);


    // --- Functions ---

    /**
     * Shows the loading spinner.
     */
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hides the loading spinner.
     */
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Handles the search button click or Enter key press.
     */
    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            alert('Please enter a search term.');
            return;
        }

        console.log(`[App] Performing search for: ${query}`);
        hideVideoPlayer(); // Hide player if visible
        clearSearchResults();
        showLoading();

        try {
            // Call the API function (defined in api.js)
            const results = await searchAnime(query);
            displaySearchResults(results);
        } catch (error) {
            console.error("[App] Search failed:", error);
            displayErrorMessage(`Search failed: ${error.message || 'Could not connect to backend.'}`);
        } finally {
            hideLoading();
        }
    }

    /**
     * Clears the search results area.
     */
    function clearSearchResults() {
        searchResultsContainer.innerHTML = '';
    }

    /**
     * Displays an error message in the search results area.
     * @param {string} message - The error message to display.
     */
     function displayErrorMessage(message) {
        clearSearchResults(); // Clear previous results/messages
        const errorElement = document.createElement('p');
        errorElement.className = 'placeholder-text error-message'; // Reuse placeholder style or add specific error style
        errorElement.textContent = `Error: ${message}`;
        errorElement.style.color = 'var(--accent-color)'; // Make error prominent
        searchResultsContainer.appendChild(errorElement);
    }


    /**
     * Displays the search results in the grid.
     * @param {Array<object>} results - Array of anime objects from the API.
     */
    function displaySearchResults(results) {
        clearSearchResults(); // Clear previous results or placeholder

        if (!results || results.length === 0) {
            const noResultsElement = document.createElement('p');
            noResultsElement.className = 'placeholder-text';
            noResultsElement.textContent = 'No anime found matching your search.';
            searchResultsContainer.appendChild(noResultsElement);
            return;
        }

        results.forEach(anime => {
            const card = createAnimeCard(anime);
            searchResultsContainer.appendChild(card);
        });
    }

    /**
     * Creates an HTML element for a single anime result card.
     * @param {object} anime - Anime data object { id, title, posterUrl, year }.
     * @returns {HTMLElement} The anime card element.
     */
    function createAnimeCard(anime) {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.dataset.animeId = anime.id; // Store the ID for later fetching

        // Basic sanitization/validation (more robust validation recommended)
        const title = anime.title || 'Untitled';
        const posterUrl = anime.posterUrl || 'https://via.placeholder.com/180x250?text=No+Image';
        const year = anime.year || 'N/A';

        card.innerHTML = `
            <img src="${posterUrl}" alt="${title} Poster" loading="lazy">
            <div class="anime-card-content">
                <h3>${title}</h3>
                <p class="year">Year: ${year}</p>
            </div>
        `;
        return card;
    }

    /**
     * Handles clicks on anime result cards using event delegation.
     * @param {Event} event - The click event.
     */
    function handleResultClick(event) {
        const card = event.target.closest('.anime-card');
        if (card && card.dataset.animeId) {
            const animeId = card.dataset.animeId;
            console.log(`[App] Anime card clicked, ID: ${animeId}`);
            fetchAndDisplayAnimeDetails(animeId);
        }
    }

    /**
     * Fetches details (including episode sources) for a selected anime and displays the player.
     * @param {string} animeId - The ID of the anime to fetch.
     */
    async function fetchAndDisplayAnimeDetails(animeId) {
        showLoading();
        try {
            // Call the API function (defined in api.js)
            currentAnimeData = await getAnimeSources(animeId);
            if (!currentAnimeData || !currentAnimeData.episodes || currentAnimeData.episodes.length === 0) {
                 throw new Error("No episode data received from the backend.");
            }
            displayVideoPlayer(currentAnimeData);
        } catch (error) {
            console.error("[App] Failed to fetch anime details:", error);
            alert(`Error loading anime details: ${error.message || 'Could not retrieve episode information.'}`);
             // Optionally: Display error message near the player section or results
        } finally {
            hideLoading();
        }
    }

    /**
     * Displays the video player section with fetched anime details.
     * @param {object} animeData - Anime data including { title, episodes }.
     */
    function displayVideoPlayer(animeData) {
        videoTitleElement.textContent = animeData.title || 'Anime Title';
        populateEpisodeList(animeData.episodes);

        // Load the first episode by default if available
        if (animeData.episodes.length > 0) {
            loadVideoSource(animeData.episodes[0].link);
            updateActiveEpisodeLink(episodeListElement.querySelector('.episode-link')); // Highlight first episode
        } else {
            playerWrapper.innerHTML = '<p>No episodes available for this anime.</p>'; // Handle no episodes case
        }

        videoPlayerSection.style.display = 'block';
        // Smooth scroll to the player section
        videoPlayerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Hides the video player section.
     */
    function hideVideoPlayer() {
        videoPlayerSection.style.display = 'none';
        playerWrapper.innerHTML = '<p>Loading player...</p>'; // Reset player content
        episodeListElement.innerHTML = ''; // Clear episode list
        videoTitleElement.textContent = '';
        currentAnimeData = null;
        currentEpisodeLink = null;
    }

    /**
     * Populates the episode list UI.
     * @param {Array<object>} episodes - Array of episode objects { number, link }.
     */
    function populateEpisodeList(episodes) {
        episodeListElement.innerHTML = ''; // Clear previous list
        if (!episodes || episodes.length === 0) {
            episodeListElement.innerHTML = '<li>No episodes found.</li>';
            return;
        }

        episodes.forEach((episode, index) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#'; // Prevent page jump
            link.className = 'episode-link';
            link.textContent = `Episode ${episode.number || (index + 1)}`; // Use number or index
            link.dataset.videoLink = episode.link; // Store the actual video source link

            li.appendChild(link);
            episodeListElement.appendChild(li);
        });
    }

     /**
     * Handles clicks on episode links using event delegation.
     * @param {Event} event - The click event.
     */
     function handleEpisodeClick(event) {
        event.preventDefault(); // Prevent default anchor behavior
        const linkElement = event.target.closest('.episode-link');

        if (linkElement && linkElement.dataset.videoLink) {
            const videoSrc = linkElement.dataset.videoLink;
            console.log(`[App] Episode clicked, loading source: ${videoSrc}`);
            loadVideoSource(videoSrc);
            updateActiveEpisodeLink(linkElement);
        }
    }

    /**
     * Updates the visual indication for the currently active episode link.
     * @param {HTMLElement} activeLinkElement - The link element to mark as active.
     */
    function updateActiveEpisodeLink(activeLinkElement) {
        // Remove 'active' class from previously active link
        if (currentEpisodeLink) {
            currentEpisodeLink.classList.remove('active');
        }
        // Add 'active' class to the new link
        if (activeLinkElement) {
            activeLinkElement.classList.add('active');
            currentEpisodeLink = activeLinkElement;
        } else {
             currentEpisodeLink = null;
        }
    }

    /**
     * Loads the video source into the player element (iframe).
     * NOTE: This assumes the link provided by your backend (via Kodik) is an embeddable iframe URL.
     * If it's a direct video file URL (like .mp4), you might need a <video> tag instead.
     * Adjust this based on what `kodikwrapper` / your backend provides.
     * @param {string} videoSrc - The URL for the video source (likely an iframe src).
     */
    function loadVideoSource(videoSrc) {
        if (!videoSrc || videoSrc.startsWith('placeholder')) {
            playerWrapper.innerHTML = '<p>Video source is not available for this episode.</p>';
             console.warn("[App] Invalid or placeholder video source provided:", videoSrc);
            return;
        }

        // Assume Kodik provides an iframe-compatible URL
        // Important: Add 'allowfullscreen' and potentially other sandbox attributes for security if needed.
        // The 'allow' attribute controls features available to the iframe (like autoplay, fullscreen, etc.)
        playerWrapper.innerHTML = `
            <iframe
                src="${videoSrc}"
                frameborder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen
                title="Anime Player - ${videoTitleElement.textContent || ''}"
                referrerpolicy="origin" ></iframe>
        `;
         console.log(`[App] Iframe loaded with src: ${videoSrc}`);
    }

}); // End DOMContentLoaded

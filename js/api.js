// js/api.js

// IMPORTANT: Replace this with the actual URL of your hosted backend service
// Example: 'https://your-anime-backend.herokuapp.com'
const BACKEND_API_URL = 'YOUR_BACKEND_URL_HERE'; // Needs to be set correctly!

// --- Functions to interact with your backend ---

/**
 * Searches for anime via the backend service.
 * @param {string} query - The search term.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of anime results.
 * Expected anime object format: { id: string, title: string, posterUrl: string, year: string|number }
 */
async function searchAnime(query) {
    if (!BACKEND_API_URL || BACKEND_API_URL === 'YOUR_BACKEND_URL_HERE') {
        console.error("Backend API URL is not configured in js/api.js!");
        alert("Error: Backend URL not configured. Cannot perform search.");
        // Return mock data or empty array for frontend testing without a backend
        // return Promise.resolve(getMockSearchResults(query));
        return Promise.resolve([]);
    }

    try {
        // Construct the request URL for your backend's search endpoint
        const url = new URL(`${BACKEND_API_URL}/search`);
        url.searchParams.append('title', query); // Assuming backend expects 'title' query param

        console.log(`[API] Searching for: ${query} at ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            // Try to get error message from backend response body
            let errorMsg = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg; // Assuming backend sends { error: "message" }
            } catch (e) { /* Ignore if response is not JSON */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("[API] Search results received:", data);

        // Ensure data is an array (backend should return { results: [...] })
        if (!Array.isArray(data.results)) {
            console.error("[API] Error: Expected 'results' array in backend response", data);
            return [];
        }
        // Optionally: Validate the structure of each result item here
        return data.results;

    } catch (error) {
        console.error("[API] Error searching anime:", error);
        throw error; // Re-throw the error so the calling function knows something went wrong
    }
}

/**
 * Fetches video sources (episodes with player URLs) for a specific anime ID.
 * @param {string} animeId - The unique identifier for the anime (provided by search results).
 * @returns {Promise<object>} A promise that resolves with anime details including episodes.
 * Expected return format: { title: string, episodes: Array<{ number: string|number, link: string }> }
 */
async function getAnimeSources(animeId) {
    if (!BACKEND_API_URL || BACKEND_API_URL === 'YOUR_BACKEND_URL_HERE') {
        console.error("Backend API URL is not configured in js/api.js!");
        alert("Error: Backend URL not configured. Cannot fetch sources.");
        // Return mock data or empty object for frontend testing
        // return Promise.resolve(getMockAnimeSources(animeId));
         return Promise.resolve({ title: "Anime Title Placeholder", episodes: [] });
    }

    try {
        // Construct the request URL for your backend's source endpoint
        const url = new URL(`${BACKEND_API_URL}/anime/${animeId}/sources`); // Example endpoint structure

        console.log(`[API] Fetching sources for anime ID: ${animeId} at ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
           // Try to get error message from backend response body
            let errorMsg = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg; // Assuming backend sends { error: "message" }
            } catch (e) { /* Ignore if response is not JSON */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("[API] Anime sources received:", data);

         // Ensure data has expected structure (backend should return { title: "...", episodes: [...] })
        if (!data || typeof data.title !== 'string' || !Array.isArray(data.episodes)) {
            console.error("[API] Error: Invalid format for anime sources response", data);
            return { title: "Error Loading Title", episodes: [] };
        }
         // Optionally: Validate the structure of each episode item here
        return data;

    } catch (error) {
        console.error("[API] Error fetching anime sources:", error);
         throw error; // Re-throw the error
    }
}


// --- Mock Data Functions (for testing frontend without a backend) ---

// function getMockSearchResults(query) {
//     console.warn("[API] Using Mock Search Results for query:", query);
//     return [
//         { id: 'mock1', title: `Mock Anime Result 1 for ${query}`, posterUrl: 'https://via.placeholder.com/180x250/6a0dad/ffffff?text=Anime+1', year: 2023 },
//         { id: 'mock2', title: 'Mock Anime Result 2 - A Very Long Title That Might Wrap Around', posterUrl: 'https://via.placeholder.com/180x250/333333/ffffff?text=Anime+2', year: 2022 },
//         { id: 'mock3', title: 'Mock Anime 3', posterUrl: 'https://via.placeholder.com/180x250/ff6347/ffffff?text=Anime+3', year: '2021' },
//     ];
// }

// function getMockAnimeSources(animeId) {
//      console.warn(`[API] Using Mock Anime Sources for ID: ${animeId}`);
//      // In a real scenario, the link would be an iframe source URL
//      // Using placeholder URLs here
//      return {
//          title: `Mock Title for Anime ${animeId}`,
//          episodes: [
//              { number: 1, link: 'https://www.w3schools.com/html/mov_bbb.mp4' }, // Example video file
//              { number: 2, link: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' }, // Another video file
//              { number: 3, link: 'placeholder_for_episode_3' },
//              { number: 4, link: 'placeholder_for_episode_4' },
//              { number: 5, link: 'placeholder_for_episode_5' },
//          ]
//      };
// }

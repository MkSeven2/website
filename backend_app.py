# backend_app.py (Example using Flask)
from flask import Flask, request, jsonify
from flask_cors import CORS # For handling Cross-Origin requests from your frontend
import kodikwrapper # Make sure it's installed

app = Flask(__name__)
# IMPORTANT: Configure CORS properly for production.
# Allow requests only from your GitHub Pages domain.
# For development, you might allow '*' or 'http://127.0.0.1:5500' (if using Live Server)
# Replace 'https://yourusername.github.io' with your actual GitHub Pages URL
CORS(app, resources={r"/search": {"origins": "https://mkseven2.github.io"},
                    r"/anime/*": {"origins": "https://yourusername.github.io"}})
# Example permissive CORS for local testing (DO NOT USE IN PRODUCTION)
# CORS(app)

# Initialize Kodik client (replace with your actual token if needed)
# !! SECURITY WARNING: Do NOT hardcode your real token here in public code !!
#    Use environment variables or a secure configuration method.
KODIK_API_TOKEN = "YOUR_KODIK_API_TOKEN_ENV_VAR" # Load from environment
kodik_client = kodikwrapper.Kodik(token=KODIK_API_TOKEN)

# Define Search Endpoint
@app.route('/search', methods=['GET'])
def search_anime_endpoint():
    search_query = request.args.get('title')
    if not search_query:
        return jsonify({"error": "Missing 'title' query parameter"}), 400

    try:
        # Use kodikwrapper to search (adjust params as needed)
        # Check kodikwrapper docs for available search parameters
        search_results = kodik_client.search(title=search_query, limit=20, with_material_data=True)

        # Format results for the frontend
        formatted_results = []
        if search_results and search_results.get('results'):
             for item in search_results['results']:
                 material_data = item.get('material_data') or {}
                 formatted_results.append({
                     "id": item.get('id'), # Or another unique ID like shikimori_id if available
                     "title": item.get('title') or material_data.get('title', 'Unknown Title'),
                     "posterUrl": material_data.get('poster_url', ''),
                     "year": material_data.get('year', 'N/A')
                     # Add other relevant fields if needed
                 })

        return jsonify({"results": formatted_results})

    except Exception as e:
        print(f"Error during Kodik search: {e}") # Log the error server-side
        return jsonify({"error": f"Failed to search anime: {e}"}), 500


# Define Endpoint to Get Anime Sources (Episodes)
@app.route('/anime/<anime_id>/sources', methods=['GET'])
def get_anime_sources_endpoint(anime_id):
     if not anime_id:
        return jsonify({"error": "Missing anime ID"}), 400

     try:
        # Use kodikwrapper to get sources (episodes/links)
        # The method might vary based on the ID type (e.g., kodik ID, shikimori ID)
        # Assuming anime_id is the one returned by search
        # You might need to fetch details first if search didn't provide enough info
        # This part heavily depends on how kodikwrapper works and what ID you have
        print(f"Fetching sources for Kodik ID: {anime_id}")

        # Kodik API often requires specifying translation type for links
        # Check kodikwrapper docs for how to specify translation (e.g., id=1131 for Anilibria)
        # Example: Fetching links for a specific translation ID
        # This is a GUESS - check kodikwrapper documentation for the correct method!
        source_data = kodik_client.get_links(id=anime_id, # Assuming anime_id is the Kodik content ID
                                             translation_type="voice", # or "subtitles"
                                             # translation_id=1131, # Example: Anilibria ID
                                             episode_sorting="asc") # Get episodes in order

        if not source_data or not source_data.get('links'):
            return jsonify({"error": "No sources found for this anime ID"}), 404

        # Extract title (might need another API call or use data from search)
        # Placeholder title fetching logic
        anime_title = f"Anime Title for {anime_id}" # Replace with actual title if possible

        # Format episodes (links)
        formatted_episodes = []
        # Kodik provides links per translation. You need to select one.
        # Example: Select the first available voice translation
        # This logic needs refinement based on actual kodikwrapper response structure!
        selected_translation_links = next(iter(source_data['links'].values()), []) # Get first list of episode links

        for episode_num_str, episode_link in selected_translation_links.items():
             # Ensure the link is embeddable (often starts with // or https://)
             if episode_link and (episode_link.startswith('//') or episode_link.startswith('http')):
                 # Prepend https: if link starts with //
                 full_link = f"https:{episode_link}" if episode_link.startswith('//') else episode_link
                 formatted_episodes.append({
                     "number": episode_num_str,
                     "link": full_link # This should be the iframe src URL
                 })

        # Sort episodes numerically if keys are strings
        formatted_episodes.sort(key=lambda x: int(x['number']))

        return jsonify({
            "title": anime_title, # Ideally get the real title
            "episodes": formatted_episodes
            })

     except Exception as e:
        print(f"Error getting sources for anime ID {anime_id}: {e}") # Log the error
        return jsonify({"error": f"Failed to get anime sources: {e}"}), 500


if __name__ == '__main__':
    # For development only, use a proper WSGI server like Gunicorn for production
    app.run(debug=True, port=5001) # Run on a different port than frontend dev server

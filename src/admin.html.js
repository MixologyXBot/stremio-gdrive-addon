export const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stremio GDrive Admin</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f0f2f5; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        h1, h2 { color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background: #0070f3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0051a2; }
        button.delete { background: #e00; padding: 5px 10px; font-size: 14px; }
        button.delete:hover { background: #c00; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; }
        .toast { position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 10px 20px; border-radius: 4px; display: none; }
    </style>
</head>
<body>
    <h1>GDrive TMDB Mappings</h1>

    <div class="card">
        <h2>Add New Mapping</h2>
        <form id="mappingForm">
            <div class="form-group">
                <label for="gdriveId">Google Drive ID (File or Folder)</label>
                <input type="text" id="gdriveId" required placeholder="1abc... or 1xyz...">
            </div>
            <div class="form-group">
                <label for="tmdbId">TMDB ID or URL</label>
                <input type="text" id="tmdbId" required placeholder="12345 or https://www.themoviedb.org/movie/12345">
            </div>
            <div class="form-group">
                <label for="type">Content Type</label>
                <select id="type">
                    <option value="movie">Movie</option>
                    <option value="tv">TV Series</option>
                </select>
            </div>
            <button type="submit">Save Mapping</button>
        </form>
    </div>

    <div class="card">
        <h2>Current Mappings</h2>
        <div id="loading">Loading...</div>
        <table id="mappingsTable" style="display: none;">
            <thead>
                <tr>
                    <th>GDrive ID</th>
                    <th>TMDB ID</th>
                    <th>Type</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="mappingsList"></tbody>
        </table>
    </div>

    <div id="toast" class="toast"></div>

    <script>
        const API_BASE = '/admin';

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 3000);
        }

        async function loadMappings() {
            try {
                const res = await fetch(\`\${API_BASE}/mappings\`);
                if (!res.ok) throw new Error('Failed to load mappings');
                const mappings = await res.json();

                const tbody = document.getElementById('mappingsList');
                tbody.innerHTML = '';

                // Mappings might be an object or array depending on KV listing implementation
                // Assuming array of objects { gdriveId, tmdbId, type } for now
                const list = Array.isArray(mappings) ? mappings : [];

                list.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = \`
                        <td>\${m.gdriveId}</td>
                        <td><a href="https://www.themoviedb.org/\${m.type}/\${m.tmdbId}" target="_blank">\${m.tmdbId}</a></td>
                        <td>\${m.type}</td>
                        <td><button class="delete" onclick="deleteMapping('\${m.gdriveId}')">Delete</button></td>
                    \`;
                    tbody.appendChild(tr);
                });

                document.getElementById('loading').style.display = 'none';
                document.getElementById('mappingsTable').style.display = 'table';
            } catch (e) {
                showToast(e.message);
            }
        }

        async function deleteMapping(gdriveId) {
            if (!confirm('Are you sure?')) return;
            try {
                const res = await fetch(\`\${API_BASE}/mapping\`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gdriveId })
                });
                if (!res.ok) throw new Error('Failed to delete');
                showToast('Mapping deleted');
                loadMappings();
            } catch (e) {
                showToast(e.message);
            }
        }

        document.getElementById('mappingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const gdriveId = document.getElementById('gdriveId').value.trim();
            const tmdbInput = document.getElementById('tmdbId').value.trim();
            const type = document.getElementById('type').value;

            // Extract numeric ID from URL if present
            let tmdbId = tmdbInput;
            const urlMatch = tmdbInput.match(/\\/(\\d+)(?:-|$)/);
            if (urlMatch) tmdbId = urlMatch[1];

            try {
                const res = await fetch(\`\${API_BASE}/mapping\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gdriveId, tmdbId, type })
                });
                if (!res.ok) throw new Error(await res.text());

                showToast('Mapping saved');
                document.getElementById('mappingForm').reset();
                loadMappings();
            } catch (e) {
                showToast(e.message);
            }
        });

        loadMappings();
    </script>
</body>
</html>
`;

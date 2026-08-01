const toggle = document.getElementById('toggle-season');
const seasonField = document.getElementById('season-field');
const toseeSection = document.getElementById('tosee-section');
const toggleDeleteTosee = document.getElementById('toggle-delete-tosee');

toggle.addEventListener('change', () => {
    seasonField.classList.toggle('hidden', !toggle.checked);
    if (!toggle.checked) {
        seasonField.querySelector('input').value = '';
    }
});

// Get URL parameters
const params = new URLSearchParams(window.location.search);
const toseeId = params.get('tosee_id');

// If tosee_id is provided, fetch the item and pre-fill form
if (toseeId) {
    toseeSection.classList.remove('hidden');
    fetch(`/api/tosee/${toseeId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch to-see item');
            return res.json();
        })
        .then(item => {
            // Pre-fill form fields
            document.querySelector('input[name="title"]').value = item.title;
            document.querySelector('input[name="imdb_link"]').value = item.imdb_link || '';
            
            // Set series toggle if it's a series
            if (item.media_type === 'series') {
                toggle.checked = true;
                seasonField.classList.remove('hidden');
                if (item.seasons) {
                    document.querySelector('input[name="season"]').value = item.seasons;
                }
            }
        })
        .catch(err => {
            console.error('Error loading to-see item:', err);
            alert('Error loading item data');
        });
}

const form = document.getElementById('review-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    if (!toggle.checked) data.season = null;
    if (data.season === '') data.season = null;
    if (data.date === '') data.date = null;
    if (data.imdb_link === '') data.imdb_link = null;
    data.note = parseFloat(data.note);
    if (data.season !== null) data.season = parseInt(data.season, 10);
    
    // Add tosee fields if present
    if (toseeId) {
        data.tosee_id = parseInt(toseeId, 10);
        data.delete_tosee = toggleDeleteTosee.checked;
    }

    const res = await fetch('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert('Review added successfully!');
        window.location.href = '/';
    } else {
        const err = await res.text();
        alert('Error: ' + err);
    }
});
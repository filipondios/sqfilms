const form = document.getElementById('tosee-form');
const toggleSeries = document.getElementById('toggle-series');
const seasonsField = document.getElementById('seasons-field');

function toggleSeasonsField() {
    const show = toggleSeries.checked;
    seasonsField.classList.toggle('hidden', !show);
    if (!show) {
        seasonsField.querySelector('input').value = '';
    }
}

toggleSeries.addEventListener('change', toggleSeasonsField);
toggleSeasonsField();

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    data.media_type = toggleSeries.checked ? 'series' : 'movie';
    if (data.imdb_link === '') data.imdb_link = null;
    if (data.seasons === '') data.seasons = null;
    if (data.seasons !== null) data.seasons = parseInt(data.seasons, 10);

    const response = await fetch('/tosee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        alert('Item added successfully!');
        window.location.href = '/tosee';
    } else {
        const error = await response.text();
        alert('Error: ' + error);
    }
});

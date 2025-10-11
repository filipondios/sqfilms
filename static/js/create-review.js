const toggle = document.getElementById('toggle-season');
const seasonField = document.getElementById('season-field');

toggle.addEventListener('change', () => {
    seasonField.classList.toggle('hidden', !toggle.checked);
    if (!toggle.checked) {
        seasonField.querySelector('input').value = '';
    }
});

const form = document.getElementById('review-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    if (!toggle.checked) data.season = null;
    if (data.date === '') data.date = null;
    data.note = parseFloat(data.note);

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
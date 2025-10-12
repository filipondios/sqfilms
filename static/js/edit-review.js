const form = document.getElementById('review-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.dataset.id;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.date === '') data.date = null;
    if (data.season === '') data.season = null;
    data.note = parseFloat(data.note);

    const res = await fetch(`/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert('Review updated successfully!');
        window.location.href = '/';
    } else {
        const err = await res.text();
        alert('Error: ' + err);
    }
});
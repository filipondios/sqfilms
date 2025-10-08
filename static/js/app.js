async function loadReviews() {
  const params = new URLSearchParams(window.location.search);
  const res = await fetch('/reviews' + (params.toString() ? '?' + params.toString() : ''));
  const list = document.getElementById('reviews');
  const summary = document.getElementById('summary');

  if (!res.ok) {
    list.innerHTML = `<li class="error">Error loading reviews</li>`;
    return;
  }

  const data = await res.json();
  if (data.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <img src="/img/warning.svg" class="empty-icon" aria-hidden="true"/>
        <p class="no-results">No reviews found</p>
      </div>`;
    summary.textContent = "";
    return;
  }

  let films = 0, series = 0;
  list.innerHTML = '';
  for (const r of data) {
    const li = document.createElement('li');
    const isSeries = r.season !== null;
    li.innerHTML = `
      <div class="review-header">
        <h3>${r.title}
        <span class="tag ${isSeries ? 'series' : 'film'}'>${isSeries ? 'Series' : 'Film'}</span>
        ${isSeries ? `<span class='tag season'>Season ${r.season}</span>` : ""}
        </h3></div>
        <div class="review-meta">
        <span class="note">${r.note.toFixed(2)}/10
        <img src="/img/star.svg" alt="*" class="star"></span>
        <span class="date">${r.date}</span></div>`;
    list.appendChild(li);
    if (isSeries) series++; else films++;
  }
  summary.textContent = `${films} Films, ${series} Series - ${films + series} Reviews total`;
}

window.addEventListener('DOMContentLoaded', loadReviews);

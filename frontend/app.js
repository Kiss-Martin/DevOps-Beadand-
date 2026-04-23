const API_BASE = window.APP_CONFIG?.apiBase || '';

const list = document.getElementById('moviesList');
const reloadBtn = document.getElementById('reloadBtn');

async function loadMovies() {
  list.innerHTML = '<li>Betöltés...</li>';
  try {
    const response = await fetch(`${API_BASE}/api/movies`);
    const movies = await response.json();

    if (!Array.isArray(movies) || movies.length === 0) {
      list.innerHTML = '<li>Nincs találat.</li>';
      return;
    }

    list.innerHTML = movies
      .map((movie) => `<li><strong>${movie.title}</strong> (${movie.year ?? 'ismeretlen év'}) — ${movie.director_name ?? 'ismeretlen rendező'}</li>`)
      .join('');
  } catch (error) {
    list.innerHTML = '<li>Hiba történt az adatok betöltésekor.</li>';
  }
}

reloadBtn.addEventListener('click', loadMovies);
loadMovies();

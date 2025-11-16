const API_KEY = '407f37afc11c41faa2e6fac9264fbcb0'; // GANTI DENGAN API KEY DARI NEWSAPI.ORG
const BASE_URL = 'https://newsapi.org/v2/top-headlines';
let currentCategory = 'general';
let bookmarks = JSON.parse(localStorage.getItem('rifqyNewsBookmarks') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  loadCategory('general');
  registerSW();
});

async function loadCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.categories button').forEach(b => b.classList.remove('active'));
  document.querySelector(`button[onclick="loadCategory('${category}')"]`).classList.add('active');

  const container = document.getElementById('news-container');
  const loading = document.getElementById('loading');
  container.innerHTML = '';
  loading.classList.remove('hidden');

  const cached = localStorage.getItem(`rifqyNews_${category}`);
  if (cached && !navigator.onLine) {
    document.getElementById('offline').classList.remove('hidden');
    displayNews(JSON.parse(cached));
    loading.classList.add('hidden');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}?country=id&category=${category}&apiKey=${API_KEY}`);
    const data = await res.json();
    if (data.articles) {
      localStorage.setItem(`rifqyNews_${category}`, JSON.stringify(data.articles));
      displayNews(data.articles);
    }
  } catch (e) {
    container.innerHTML = '<p>Gagal memuat berita. Coba lagi.</p>';
  }
  loading.classList.add('hidden');
}

function displayNews(articles) {
  const container = document.getElementById('news-container');
  container.innerHTML = articles.map(article => {
    const isBookmarked = bookmarks.some(b => b.url === article.url);
    return `
      <div class="card" onclick="openArticle('${article.url}')">
        ${article.urlToImage ? `<img src="${article.urlToImage}" alt="img" onerror="this.src='https://via.placeholder.com/600x400/6c5ce7/fff?text=No+Image'">` : ''}
        <div class="card-content">
          <h3>${article.title}</h3>
          <p>${article.description || 'Klik untuk baca selengkapnya...'}</p>
          <div>
            <small class="source">${article.source.name} • ${formatDate(article.publishedAt)}</small>
            <button class="bookmark" onclick="event.stopPropagation(); toggleBookmark('${article.url}', this)">
              ${isBookmarked ? '★' : '☆'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openArticle(url) {
  window.open(url, '_blank');
}

function toggleBookmark(url, btn) {
  const article = { url };
  const idx = bookmarks.findIndex(b => b.url === url);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
    btn.textContent = '☆';
  } else {
    bookmarks.push(article);
    btn.textContent = '★';
  }
  localStorage.setItem('rifqyNewsBookmarks', JSON.stringify(bookmarks));
}

function searchNews() {
  const query = document.getElementById('search').value.trim();
  if (!query) return;
  window.location.href = `https://newsapi.org/?q=${encodeURIComponent(query)}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
    } catch (e) { console.log('SW registration failed'); }
  }
}

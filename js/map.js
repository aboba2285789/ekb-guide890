// Инициализация карты
const map = L.map('map').setView([56.84, 60.60], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let places = [];       // массив со всеми точками (загрузим из JSON)
const markers = [];    // {data, marker, selected}
const layers = {};     // по категориям L.layerGroup()
let routeControl = null;

// Загружаем JSON после того, как DOM готов
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/places.json')
        .then(r => {
            if (!r.ok) throw new Error(HTTP error! Status: ${r.status});
            return r.json();
        })
        .then(data => {
            places = data;
            initCategories();
            initPlaces();
        })
        .catch(e => {
            alert('Не удалось загрузить data/places.json — убедитесь, что файл существует и сайт открыт через HTTPS GitHub Pages.');
            console.error(e);
        });
});

// Инициализация категорий
function initCategories() {
    const cats = [...new Set(places.map(p => p.category))];
    const el = document.getElementById('categories');
    el.innerHTML = '';
    cats.forEach(cat => {
        layers[cat] = L.layerGroup().addTo(map);
        const row = document.createElement('div');
        row.innerHTML = <label><input type="checkbox" data-cat="${cat}" checked> ${cat}</label>;
        el.appendChild(row);
    });

    // Слушатель переключения категорий
    el.querySelectorAll('input[type=checkbox]').forEach(ch => ch.addEventListener('change', ev => {
        const cat = ev.target.dataset.cat;
        if (ev.target.checked) map.addLayer(layers[cat]);
        else map.removeLayer(layers[cat]);
    }));
}

// Инициализация точек на карте
function initPlaces() {
    const listEl = document.getElementById('places-list');
    listEl.innerHTML = '';

    pl
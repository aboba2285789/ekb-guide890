// Инициализация карты
const map = L.map('map').setView([56.84, 60.60], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let places = [];       // массив со всеми точками (загрузим из JSON)
const markers = [];    // {data, marker, selected}
const layers = {};     // по категориям L.layerGroup()
let routeControl = null;

// Загрузка JSON
fetch('data/places.json')
  .then(r => r.json())
  .then(data => {
      places = data;
      initCategories();
      initPlaces();
  })
  .catch(e => {
      alert('Не удалось загрузить data/places.json — открой сайт через HTTP (GitHub Pages).');
      console.error(e);
  });

// Инициализация категорий
function initCategories(){
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
        if(ev.target.checked) map.addLayer(layers[cat]);
        else map.removeLayer(layers[cat]);
    }));
}

// Инициализация точек на карте
function initPlaces(){
    const listEl = document.getElementById('places-list');
    listEl.innerHTML = '';

    places.forEach((p, i) => {
        const iconName = p.icon || catToIcon(p.category);
        const icon = L.icon({ 
            iconUrl: 'icons/' + iconName, 
            iconSize:[40,40], 
            iconAnchor:[20,40], 
            popupAnchor:[0,-34] 
        });

        const marker = L.marker(p.coords, {icon})
            .bindPopup(<b>${p.name}</b><br><i>${p.category}</i><br>${p.desc || ''}${p.url?'<br><a href="'+p.url+'" target="_blank">Источник</a>':''});
        marker.addTo(layers[p.category] || map);

        markers.push({data: p, marker, selected:false});

        const row = document.createElement('div');
        row.className = 'place';
        row.innerHTML = <label><input type="checkbox" data-idx="${markers.length-1}"> <strong>${p.name}</strong><div style="font-size:12px;color:#666">${p.category}</div></label>;

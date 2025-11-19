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
    listEl.innerHTML = '';

    places.forEach((p) => {
        const iconName = p.icon || catToIcon(p.category);
        const icon = L.icon({
            iconUrl: 'icons/' + iconName,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -34]
        });

        const marker = L.marker(p.coords, { icon })
            .bindPopup(
                <b>${p.name}</b><br><i>${p.category}</i><br>${p.desc || ''}${p.url ? '<br><a href="' + p.url + '" target="_blank">Источник</a>' : ''}
            );
        marker.addTo(layers[p.category] || map);

        markers.push({ data: p, marker, selected: false });

        const row = document.createElement('div');
        row.className = 'place';
        row.innerHTML = <label><input type="checkbox" data-idx="${markers.length - 1}"> <strong>${p.name}</strong><div style="font-size:12px;color:#666">${p.category}</div></label>;
        listEl.appendChild(row);
    });

    // Слушатель выбора точек в списке
    listEl.querySelectorAll('input[type=checkbox]').forEach(ch => ch.addEventListener('change', ev => {
        const idx = parseInt(ev.target.dataset.idx, 10);
        markers[idx].selected = ev.target.checked;
        if (markers[idx].selected) {
            markers[idx].marker.openPopup();
            map.panTo(markers[idx].data.coords);
        }
    }));

    // Кнопка "Сбросить"
    document.getElementById('btn-clear').addEventListener('click', () => {
        document.querySelectorAll('#places-list input[type=checkbox]').forEach(ch => ch.checked = false);
        markers.forEach(m => m.selected = false);
        if (routeControl) { map.removeControl(routeControl); routeControl = null; }
    });

    // Кнопка "Построить маршрут"
    document.getElementById('btn-build').addEventListener('click', buildRoute);
}

// Функция для выбора иконки по категории
function catToIcon(cat) {
    const mapIcons = {
        "Памятники архитектуры": "arch.png",
        "Военная история": "military.png",
        "Городская история": "city.png",
        "Индустриальная история": "industry.png",
        "Литературная тропа": "literature.png",
        "Музыка и театр": "culture.png",
        "Наука и образование": "science.png",
        "Парки, сады и скверы": "park.png",
        "Религия и культ": "religion.png",
        "Конструктивизм СССР": "constructivism.png"
    };
    return mapIcons[cat] || 'arch.png';
}

// Построение маршрута между выбранными точками
function buildRoute() {
    const waypoints = markers
        .filter(m => m.selected)
        .map(m => L.latLng(m.data.coords[0], m.data.coords[1]));

    if (waypoints.length < 2) {
        alert('Выберите минимум 2 точки для маршрута.');
        return;
    }

    if (routeControl) { map.removeControl(routeControl); routeControl = null; }

    routeControl = L.Routing.control({
        waypoints,
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        showAlternatives: false
    }).addTo(map);
}
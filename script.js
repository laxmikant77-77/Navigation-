
document.addEventListener("DOMContentLoaded", () => {

    const map = L.map('map', {
        zoomControl: true
    }).setView([15.759257, 78.037734], 17);

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 20 }
    ).addTo(map);

    setTimeout(() => {
        map.invalidateSize();
    }, 300);

});

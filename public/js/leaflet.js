/* eslint-disable */
export const displayMap = (locations) => {
    const map = L.map("map", {
        zoomControl: false,
        touchZoom: true,
        tap: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);

    const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    const points = [];
    locations.forEach((loc) => {
        const coords = [loc.coordinates[1], loc.coordinates[0]];
        points.push(coords);

        L.marker(coords, { icon: customIcon })
            .addTo(markers)
            .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`);
    });

    const bounds = L.latLngBounds(points).pad(0.5);
    map.fitBounds(bounds);

    map.scrollWheelZoom.disable();
    map.once("focus", () => map.scrollWheelZoom.enable());
};

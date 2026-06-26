/* Theme-aware CARTO basemap config shared by the catalog and details maps.
   Hardcoding the dark tiles left the map dark after switching to the light theme. */
const ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const CARTO_TILES = {
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        bg: "#171520",
        attribution: ATTRIBUTION,
    },
    light: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        bg: "#e9e7f0",
        attribution: ATTRIBUTION,
    },
};

export const cartoTiles = (theme) => (theme === "light" ? CARTO_TILES.light : CARTO_TILES.dark);

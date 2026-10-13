import Dashboard from "./js/Dashboard.js";

const widgetsContainer = document.querySelector("#widgets");
const dashboard = new Dashboard(widgetsContainer);
const widgetButtons = document.querySelectorAll("[data-widget]");
const userName = document.querySelector("#user-name");
const greeting = document.querySelector("#greeting");
const cityInput = document.querySelector("#global-city");
const favoritesContainer = document.querySelector("#favorite-cities");
const STORAGE_KEY = "russia-traveler-dashboard-v2";

userName.value = dashboard.data.userName || "";
cityInput.value = dashboard.data.currentCity || "";

function updateGreeting() {
    const name = userName.value.trim();
    greeting.textContent = name ? `Здравствуйте, ${name}!` : "Добро пожаловать!";
}

function renderFavorites() {
    favoritesContainer.replaceChildren();
    const favorites = dashboard.data.favorites || [];
    if (!favorites.length) {
        const empty = document.createElement("span");
        empty.textContent = "Пока пусто — добавьте город выше";
        favoritesContainer.append(empty);
        return;
    }
    favorites.forEach((city) => {
        const group = document.createElement("div");
        group.className = "favorite-city";
        const open = document.createElement("button");
        open.type = "button";
        open.textContent = city;
        open.title = `Подставить ${city} в поиск`;
        open.addEventListener("click", () => {
            cityInput.value = city;
            dashboard.data.currentCity = city;
            dashboard.save();
            applyCity(city);
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "favorite-city__remove";
        remove.textContent = "×";
        remove.title = `Удалить ${city} из избранного`;
        remove.addEventListener("click", () => {
            dashboard.data.favorites = favorites.filter((item) => item !== city);
            dashboard.save();
            renderFavorites();
        });
        group.append(open, remove);
        favoritesContainer.append(group);
    });
}

function applyCity(city) {
    const widgets = Array.from(dashboard.widgets.values());
    let used = false;
    widgets.forEach((widget) => {
        const weather = widget.element?.querySelector(".weather__search");
        const place = widget.element?.querySelector(".place__search");
        if (weather) {
            weather.value = city;
            weather.dispatchEvent(new Event("input", { bubbles: true }));
            used = true;
        }
        if (place) {
            place.value = city;
            const button = widget.element.querySelector(".place__button");
            button?.click();
            used = true;
        }
    });
    if (!used) {
        dashboard.addWidget("weather");
        dashboard.addWidget("place");
        // Widgets are now mounted; the next microtask lets their DOM finish rendering.
        queueMicrotask(() => applyCity(city));
    }
}

userName.addEventListener("input", () => {
    updateGreeting();
    dashboard.data.userName = userName.value;
    dashboard.save();
});

document.querySelector("#save-city").addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (!city) {
        cityInput.focus();
        return;
    }
    dashboard.data.currentCity = city;
    dashboard.data.recentCities = [city, ...(dashboard.data.recentCities || []).filter((item) => item !== city)].slice(0, 10);
    dashboard.data.favorites = [...new Set([...(dashboard.data.favorites || []), city])];
    dashboard.save();
    renderFavorites();
    applyCity(city);
});

cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") document.querySelector("#save-city").click();
});

widgetButtons.forEach((button) => {
    button.addEventListener("click", () => dashboard.addWidget(button.dataset.widget));
});

updateGreeting();
renderFavorites();
if (dashboard.data.currentCity) {
    applyCity(dashboard.data.currentCity);
}

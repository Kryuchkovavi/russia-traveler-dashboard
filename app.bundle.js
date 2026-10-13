/* Bundled build for opening index.html directly and for GitHub Pages. */


/* ===== js/UIComponent.js ===== */

class UIComponent {
    constructor({ title, id, onClose, state = {}, onStateChange = () => {} }) {
        this.title = title;
        this.id = id;
        this.onClose = onClose;
        this.onStateChange = onStateChange;

        this.element = null;
        this.isMinimized = false;

        this.eventListeners = [];
        this.savedState = state || {};
    }

    render() {
        const element = document.createElement("div");

        element.className = "widget";
        element.dataset.widgetId = this.id;

        this.element = element;

        return element;
    }

    getState() {
        const fields = this.element
            ? Array.from(this.element.querySelectorAll("input, select, textarea")).map((field) => ({
                selector: field.className || field.type || field.tagName.toLowerCase(),
                type: field.type || "",
                value: field.value,
                checked: Boolean(field.checked)
            }))
            : [];

        return {
            minimized: this.isMinimized,
            fields,
            items: this.items,
            expenses: this.expenses,
            listTitle: this.listTitle,
            adviceText: this.element?.querySelector(".advice__card p")?.textContent || ""
        };
    }

    restoreFields() {
        if (!this.element || !this.savedState.fields) return;
        const fields = Array.from(this.element.querySelectorAll("input, select, textarea"));
        const used = new Set();
        this.savedState.fields.forEach((saved) => {
            const field = fields.find((candidate, index) => {
                if (used.has(index)) return false;
                const selector = candidate.className || candidate.type || candidate.tagName.toLowerCase();
                return selector === saved.selector && (candidate.type || "") === saved.type;
            });
            if (!field) return;
            used.add(fields.indexOf(field));
            field.value = saved.value ?? "";
            if (field.type === "checkbox") field.checked = Boolean(saved.checked);

        });
    }

    minimize() {
        if (!this.element) {
            return;
        }

        this.isMinimized = !this.isMinimized;

        this.element.classList.toggle(
            "widget--minimized",
            this.isMinimized
        );
    }

    close() {
        if (this.onClose) {
            this.onClose(this.id);
            return;
        }

        this.destroy();
    }

    addEventListener(element, event, handler) {
        const wrappedHandler = (...args) => {
            handler(...args);
            this.onStateChange();
        };
        element.addEventListener(event, wrappedHandler);

        this.eventListeners.push({
            element,
            event,
            handler: wrappedHandler
        });
    }

    destroy() {
        this.eventListeners.forEach(
            ({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            }
        );

        this.eventListeners = [];

        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}


/* ===== js/ToDoWidget.js ===== */

class ToDoWidget extends UIComponent {
    constructor(config) {
        super(config);

        this.items = [];
        this.listTitle = "Список вещей";
    }

    render() {
        const element = super.render();

        // Верхняя часть виджета
        const header = document.createElement("div");
        header.className = "widget__header";

        const title = document.createElement("h3");
        title.textContent = this.listTitle;

        const minimizeButton = document.createElement("button");
        minimizeButton.type = "button";
        minimizeButton.className = "widget__minimize";
        minimizeButton.textContent = "Свернуть";

        this.addEventListener(minimizeButton, "click", () => {
            this.minimize();

            minimizeButton.textContent = this.isMinimized
                ? "Развернуть"
                : "Свернуть";
        });

        const deleteWidgetButton = document.createElement("button");
        deleteWidgetButton.type = "button";
        deleteWidgetButton.className = "widget__delete";
        deleteWidgetButton.textContent = "Удалить список";

        this.addEventListener(deleteWidgetButton, "click", () => {
            this.close();
        });

        header.append(
            title,
            minimizeButton,
            deleteWidgetButton
        );

        // Поле для названия списка
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.placeholder = "Название списка";
        titleInput.value = this.listTitle;

        this.addEventListener(titleInput, "input", () => {
            const newTitle = titleInput.value.trim();

            this.listTitle = newTitle || "Список вещей";
            title.textContent = this.listTitle;
        });

        // Поле для новой вещи
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Например: зарядка";

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "widget__add";
        addButton.textContent = "Добавить вещь";

        const list = document.createElement("ul");
        list.className = "widget__list";

        this.addEventListener(list, "change", (event) => {
            if (!event.target.matches('input[type="checkbox"]')) {
                return;
            }

            const listItem = event.target.closest("li");
            const index = Array.from(list.children).indexOf(listItem);

            if (index === -1) {
                return;
            }

            this.items[index].completed = event.target.checked;

            const text = listItem.querySelector("span");

            text.classList.toggle(
                "widget__item--completed",
                event.target.checked
            );
        });

        this.addEventListener(list, "click", (event) => {
            if (!event.target.classList.contains("widget__item-delete")) {
                return;
            }

            const listItem = event.target.closest("li");
            const index = Array.from(list.children).indexOf(listItem);

            if (index === -1) {
                return;
            }

            this.items.splice(index, 1);
            this.updateList(list);
        });

        this.addEventListener(addButton, "click", () => {
            this.addItem(input, list);
        });

        this.addEventListener(input, "keydown", (event) => {
            if (event.key === "Enter") {
                this.addItem(input, list);
            }
        });

        element.append(
            header,
            titleInput,
            input,
            addButton,
            list
        );

        return element;
    }

    addItem(input, list) {
        const text = input.value.trim();

        if (!text) {
            return;
        }

        this.items.push({
            text: text,
            completed: false
        });

        input.value = "";

        this.updateList(list);
        input.focus();
    }

    updateList(list) {
        list.replaceChildren();

        this.items.forEach((item, index) => {
            const listItem = document.createElement("li");

            const leftPart = document.createElement("label");
            leftPart.className = "widget__item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = item.completed;

            const text = document.createElement("span");
            text.textContent = item.text;

            if (item.completed) {
                text.classList.add("widget__item--completed");
            }

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "widget__item-delete";
            deleteButton.textContent = "×";
            deleteButton.title = "Удалить вещь";

            leftPart.append(checkbox, text);
            listItem.append(leftPart, deleteButton);

            list.append(listItem);
        });
    }
}


/* ===== js/WeatherWidget.js ===== */

class WeatherWidget extends UIComponent {
    constructor(config) {
        super(config);

        this.cityController = null;
        this.weatherController = null;
        this.searchTimer = null;
    }

    render() {
        const element = super.render();
        this.element = element;

        const header = document.createElement("div");
        header.className = "widget__header";

        const title = document.createElement("h3");
        title.textContent = this.title;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "widget__delete";
        deleteButton.textContent = "Удалить";

        this.addEventListener(deleteButton, "click", () => {
            this.close();
        });

        header.append(title, deleteButton);

        const search = document.createElement("input");
        search.type = "search";
        search.className = "weather__search";
        search.placeholder = "Введите город России...";

        const results = document.createElement("div");
        results.className = "weather__cities";

        const result = document.createElement("div");
        result.className = "weather__result";

        const hint = document.createElement("p");
        hint.textContent = "Начните вводить название города.";

        result.append(hint);

        this.addEventListener(search, "input", () => {
            clearTimeout(this.searchTimer);

            const query = search.value.trim();

            results.replaceChildren();

            if (query.length < 2) {
                return;
            }

            this.searchTimer = setTimeout(() => {
                this.searchCities(query, results, result);
            }, 400);
        });

        element.append(
            header,
            search,
            results,
            result
        );

        return element;
    }

    async searchCities(query, results, result) {
        if (this.cityController) {
            this.cityController.abort();
        }

        this.cityController = new AbortController();

        const loading = document.createElement("p");
        loading.textContent = "Ищем города...";

        results.replaceChildren(loading);

        try {
            const url =
                "https://geocoding-api.open-meteo.com/v1/search" +
                `?name=${encodeURIComponent(query)}` +
                "&count=100" +
                "&language=ru" +
                "&format=json" +
                "&countryCode=RU";

            const response = await fetch(url, {
                signal: this.cityController.signal
            });

            if (!response.ok) {
                throw new Error("Ошибка поиска города");
            }

            const data = await response.json();

            results.replaceChildren();

            if (!data.results || data.results.length === 0) {
                const empty = document.createElement("p");
                empty.textContent = "Города не найдены.";
                results.append(empty);
                return;
            }

            data.results.forEach((city) => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "weather__city";

                const cityName = city.name;

                const region = city.admin1
                    ? `, ${city.admin1}`
                    : "";

                button.textContent = `${cityName}${region}`;

                this.addEventListener(button, "click", () => {
                    results.replaceChildren();

                    this.loadWeather(
                        cityName,
                        city.latitude,
                        city.longitude,
                        result
                    );
                });

                results.append(button);
            });
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            results.replaceChildren();

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                "Не удалось выполнить поиск.";

            results.append(errorMessage);
        }
    }

    async loadWeather(city, latitude, longitude, result) {
        if (this.weatherController) {
            this.weatherController.abort();
        }

        this.weatherController = new AbortController();

        result.replaceChildren();

        const loading = document.createElement("p");
        loading.textContent = "Загружаем погоду...";

        result.append(loading);


        try {
            const url =
                "https://api.open-meteo.com/v1/forecast" +
                `?latitude=${latitude}` +
                `&longitude=${longitude}` +
                "&current=" +
                "temperature_2m," +
                "relative_humidity_2m," +
                "apparent_temperature," +
                "precipitation," +
                "rain," +
                "showers," +
                "snowfall," +
                "weather_code," +
                "cloud_cover," +
                "wind_speed_10m," +
                "wind_direction_10m," +
                "wind_gusts_10m" +
                "&daily=sunrise,sunset" +
                "&timezone=auto";

            const response = await fetch(url, {
                signal: this.weatherController.signal
            });

            if (!response.ok) {
                throw new Error("Ошибка загрузки погоды");
            }

            const data = await response.json();

            this.showWeather(city, data, result);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            result.replaceChildren();

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                "Не удалось загрузить погоду.";

            result.append(errorMessage);
        }
    }

    showWeather(city, data, result) {
        result.replaceChildren();

        const current = data.current;

        const condition = this.getWeatherDescription(
            current.weather_code
        );

        const heading = document.createElement("div");
        heading.className = "weather__heading";

        const cityName = document.createElement("h4");
        cityName.textContent = city;

        const conditionText = document.createElement("p");
        conditionText.textContent =
            `${condition.icon} ${condition.text}`;

        heading.append(cityName, conditionText);

        const temperature = document.createElement("div");
        temperature.className = "weather__temperature";

        temperature.textContent =
            `${Math.round(current.temperature_2m)}°`;

        const details = document.createElement("div");
        details.className = "weather__details";

        this.addWeatherDetail(
            details,
            "🌡️",
            "Ощущается",
            `${Math.round(current.apparent_temperature)} °C`
        );

        this.addWeatherDetail(
            details,
            "💧",
            "Влажность",
            `${current.relative_humidity_2m}%`
        );

        this.addWeatherDetail(
            details,
            "☁️",
            "Облачность",
            `${current.cloud_cover}%`
        );

        this.addWeatherDetail(
            details,
            "💨",
            "Ветер",
            `${Math.round(current.wind_speed_10m)} км/ч`
        );

        this.addWeatherDetail(
            details,
            "🌬️",
            "Порывы",
            `${Math.round(current.wind_gusts_10m)} км/ч`
        );

        this.addWeatherDetail(
            details,
            "🌧️",
            "Осадки",
            `${current.precipitation} мм`
        );

        this.addWeatherDetail(
            details,
            "🌧️",
            "Дождь",
            `${current.rain} мм`
        );

        this.addWeatherDetail(
            details,
            "🧭",
            "Направление ветра",
            `${Math.round(current.wind_direction_10m)}°`
        );

        const sun = document.createElement("div");
        sun.className = "weather__sun";

        this.addWeatherDetail(
            sun,
            "🌅",
            "Восход",
            this.formatTime(data.daily.sunrise[0])
        );

        this.addWeatherDetail(
            sun,
            "🌇",
            "Закат",
            this.formatTime(data.daily.sunset[0])
        );

        result.append(
            heading,
            temperature,
            details,
            sun
        );
    }

    addWeatherDetail(container, icon, label, value) {
        const item = document.createElement("div");
        item.className = "weather__detail";

        const iconElement = document.createElement("span");
        iconElement.textContent = icon;

        const text = document.createElement("div");

        const labelElement = document.createElement("small");
        labelElement.textContent = label;

        const valueElement = document.createElement("strong");
        valueElement.textContent = value;

        text.append(labelElement, valueElement);
        item.append(iconElement, text);

        container.append(item);
    }

    formatTime(value) {
        if (!value) {
            return "—";
        }

        return value.slice(11, 16);
    }

    getWeatherDescription(code) {
        const descriptions = {
            0: {
                icon: "☀️",
                text: "Ясно"
            },

            1: {
                icon: "🌤️",
                text: "Преимущественно ясно"
            },

            2: {
                icon: "⛅",
                text: "Переменная облачность"
            },

            3: {
                icon: "☁️",
                text: "Пасмурно"
            },

            45: {
                icon: "🌫️",
                text: "Туман"
            },

            48: {
                icon: "🌫️",
                text: "Изморозь и туман"
            },

            51: {
                icon: "🌦️",
                text: "Небольшая морось"
            },

            53: {
                icon: "🌦️",
                text: "Морось"
            },

            55: {
                icon: "🌧️",
                text: "Сильная морось"
            },

            61: {
                icon: "🌧️",
                text: "Небольшой дождь"
            },

            63: {
                icon: "🌧️",
                text: "Дождь"
            },

            65: {
                icon: "🌧️",
                text: "Сильный дождь"
            },

            71: {
                icon: "🌨️",
                text: "Небольшой снег"
            },

            73: {
                icon: "🌨️",
                text: "Снег"
            },

            75: {
                icon: "❄️",
                text: "Сильный снег"
            },

            80: {
                icon: "🌦️",
                text: "Ливневый дождь"
            },

            81: {
                icon: "🌧️",
                text: "Сильный ливень"
            },

            82: {
                icon: "⛈️",
                text: "Очень сильный ливень"
            },

            95: {
                icon: "⛈️",
                text: "Гроза"
            },

            96: {
                icon: "⛈️",
                text: "Гроза с градом"
            },

            99: {
                icon: "⛈️",
                text: "Сильная гроза с градом"
            }
        };

        return descriptions[code] || {
            icon: "🌡️",
            text: "Неизвестная погода"
        };
    }

    destroy() {
        if (this.cityController) {
            this.cityController.abort();
        }

        if (this.weatherController) {
            this.weatherController.abort();
        }

        clearTimeout(this.searchTimer);

        super.destroy();
    }
}


/* ===== js/PlaceWidget.js ===== */

class PlaceWidget extends UIComponent {
    constructor(config) {
        super(config);

        this.controller = null;
    }

    render() {
        const element = super.render();

        element.classList.add("widget--wide");

        const header = document.createElement("div");
        header.className = "widget__header";

        const title = document.createElement("h3");
        title.textContent = this.title;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "widget__delete";
        deleteButton.textContent = "Удалить";

        this.addEventListener(deleteButton, "click", () => {
            this.close();
        });

        header.append(title, deleteButton);

        const search = document.createElement("input");
        search.type = "search";
        search.className = "place__search";
        search.placeholder = "Например: Казань";

        const searchButton = document.createElement("button");
        searchButton.type = "button";
        searchButton.className = "place__button";
        searchButton.textContent = "Найти";

        const result = document.createElement("div");
        result.className = "place__result";

        const hint = document.createElement("p");
        hint.textContent = "Введите город или интересное место.";

        result.append(hint);

        this.addEventListener(searchButton, "click", () => {
            this.searchPlace(search.value, result);
        });

        this.addEventListener(search, "keydown", (event) => {
            if (event.key === "Enter") {
                this.searchPlace(search.value, result);
            }
        });

        element.append(
            header,
            search,
            searchButton,
            result
        );

        return element;
    }

    async searchPlace(query, result) {
        const searchText = query.trim();

        if (!searchText) {
            return;
        }

        if (this.controller) {
            this.controller.abort();
        }

        this.controller = new AbortController();

        result.replaceChildren();

        const loading = document.createElement("p");
        loading.textContent = "Проверяем город...";

        result.append(loading);

        try {
            // Сначала проверяем, существует ли такой город в России
            const cityUrl =
                "https://geocoding-api.open-meteo.com/v1/search" +
                `?name=${encodeURIComponent(searchText)}` +
                "&count=10" +
                "&language=ru" +
                "&format=json" +
                "&countryCode=RU";

            const cityResponse = await fetch(cityUrl, {
                signal: this.controller.signal
            });

            if (!cityResponse.ok) {
                throw new Error("Ошибка проверки города");
            }

            const cityData = await cityResponse.json();

            const city = cityData.results?.find(
                (item) =>
                    item.country_code === "RU" &&
                    item.feature_code?.startsWith("PPL")
            );

            if (!city) {
                result.replaceChildren();

                const message = document.createElement("p");
                message.textContent =
                    "Введите название города России. Например: Казань, Москва или Санкт-Петербург.";

                result.append(message);

                return;
            }

            // Теперь ищем информацию именно об этом городе в Wikipedia
            const searchUrl =
                "https://ru.wikipedia.org/w/api.php" +
                "?action=query" +
                "&list=search" +
                `&srsearch=${encodeURIComponent(city.name)}` +
                "&format=json" +
                "&origin=*";

            const searchResponse = await fetch(searchUrl, {
                signal: this.controller.signal
            });

            if (!searchResponse.ok) {
                throw new Error("Ошибка поиска информации");
            }

            const searchData = await searchResponse.json();

            const firstResult =
                searchData.query?.search?.[0];

            if (!firstResult) {
                result.replaceChildren();

                const empty = document.createElement("p");
                empty.textContent =
                    "Информация об этом городе не найдена.";

                result.append(empty);

                return;
            }

            const title = firstResult.title;

            const summaryUrl =
                `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

            const summaryResponse = await fetch(summaryUrl, {
                signal: this.controller.signal
            });

            if (!summaryResponse.ok) {
                throw new Error("Не удалось получить информацию");
            }

            const data = await summaryResponse.json();

            this.showPlace(data, city, result);

        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            result.replaceChildren();

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                "Не удалось получить информацию о городе.";

            result.append(errorMessage);
        }
    }

    showPlace(data, city, result) {
        result.replaceChildren();

        const title = document.createElement("h4");
        title.textContent = city.name;

        if (data.thumbnail?.source) {
            const image = document.createElement("img");

            image.src = data.thumbnail.source;
            image.alt = city.name;
            image.className = "place__image";

            result.append(image);
        }

        const description = document.createElement("p");
        description.textContent =
            data.description || "Город России";

        const text = document.createElement("p");
        text.textContent =
            data.extract || "Описание города отсутствует.";

        const facts = document.createElement("div");
        facts.className = "place__facts";

        this.addFact(
            facts,
            "Регион",
            city.admin1 || "Не указан"
        );

        this.addFact(
            facts,
            "Страна",
            "Россия"
        );

        this.addFact(
            facts,
            "Координаты",
            `${city.latitude.toFixed(2)}°, ${city.longitude.toFixed(2)}°`
        );

        if (city.timezone) {
            this.addFact(
                facts,
                "Часовой пояс",
                city.timezone
            );
        }

        result.append(
            title,
            description,
            text,
            facts
        );

        if (data.content_urls?.desktop?.page) {
            const link = document.createElement("a");

            link.href = data.content_urls.desktop.page;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            link.textContent = "Подробнее о городе →";
            link.className = "place__link";

            result.append(link);
        }
    }

    addFact(container, label, value) {
        const fact = document.createElement("div");
        fact.className = "place__fact";

        const factLabel = document.createElement("small");
        factLabel.textContent = label;

        const factValue = document.createElement("strong");
        factValue.textContent = value;

        fact.append(
            factLabel,
            factValue
        );

        container.append(fact);
    }

    destroy() {
        if (this.controller) {
            this.controller.abort();
        }

        super.destroy();
    }
}


/* ===== js/RouteWidget.js ===== */

class RouteWidget extends UIComponent {
    constructor(config) {
        super(config);

        this.fromCity = null;
        this.toCity = null;

        this.fromController = null;
        this.toController = null;
    }

    render() {
        const element = super.render();

        element.classList.add("widget--wide");

        const header = document.createElement("div");
        header.className = "widget__header";

        const title = document.createElement("h3");
        title.textContent = this.title;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "widget__delete";
        deleteButton.textContent = "Удалить";

        this.addEventListener(deleteButton, "click", () => {
            this.close();
        });

        header.append(title, deleteButton);

        const fromLabel = document.createElement("label");
        fromLabel.className = "route__label";
        fromLabel.textContent = "Откуда";

        const fromInput = document.createElement("input");
        fromInput.type = "text";
        fromInput.className = "route__input";
        fromInput.placeholder = "Например, Санкт-Петербург";
        fromInput.autocomplete = "off";

        const fromResults = document.createElement("div");
        fromResults.className = "route__suggestions";

        const toLabel = document.createElement("label");
        toLabel.className = "route__label";
        toLabel.textContent = "Куда";

        const toInput = document.createElement("input");
        toInput.type = "text";
        toInput.className = "route__input";
        toInput.placeholder = "Например, Москва";
        toInput.autocomplete = "off";

        const toResults = document.createElement("div");
        toResults.className = "route__suggestions";

        const calculateButton = document.createElement("button");
        calculateButton.type = "button";
        calculateButton.className = "route__calculate";
        calculateButton.textContent = "Рассчитать маршрут";

        const result = document.createElement("div");
        result.className = "route__result";

        const hint = document.createElement("p");
        hint.textContent =
            "Выберите города отправления и назначения.";

        result.append(hint);

        this.addEventListener(fromInput, "input", () => {
            this.searchCity(
                fromInput.value,
                fromResults,
                "from"
            );
        });

        this.addEventListener(toInput, "input", () => {
            this.searchCity(
                toInput.value,
                toResults,
                "to"
            );
        });

        this.addEventListener(
            calculateButton,
            "click",
            () => {
                this.showRoute(result);
            }
        );

        element.append(
            header,
            fromLabel,
            fromInput,
            fromResults,
            toLabel,
            toInput,
            toResults,
            calculateButton,
            result
        );

        return element;
    }

    async searchCity(query, results, type) {
        const searchText = query.trim();

        if (searchText.length < 2) {
            results.replaceChildren();
            return;
        }

        if (type === "from" && this.fromController) {
            this.fromController.abort();
        }

        if (type === "to" && this.toController) {
            this.toController.abort();
        }

        const controller = new AbortController();

        if (type === "from") {
            this.fromController = controller;
        } else {
            this.toController = controller;
        }

        const loading = document.createElement("p");
        loading.textContent = "Ищем город...";

        results.replaceChildren(loading);

        try {
            const url =
                "https://geocoding-api.open-meteo.com/v1/search" +
                `?name=${encodeURIComponent(searchText)}` +
                "&count=8" +
                "&language=ru" +
                "&format=json" +
                "&countryCode=RU";

            const response = await fetch(url, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error("Ошибка поиска города");
            }

            const data = await response.json();

            results.replaceChildren();

            const cities = (data.results || []).filter(
                (city) =>
                    city.country_code === "RU" &&
                    city.feature_code?.startsWith("PPL")
            );

            if (cities.length === 0) {
                const empty = document.createElement("p");

                empty.textContent =
                    "Город России не найден.";

                results.append(empty);

                return;
            }

            cities.forEach((city) => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "route__suggestion";

                const region = city.admin1
                    ? `, ${city.admin1}`
                    : "";

                button.textContent =
                    `${city.name}${region}`;

                this.addEventListener(
                    button,
                    "click",
                    () => {
                        if (type === "from") {
                            this.fromCity = city;
                        } else {
                            this.toCity = city;
                        }

                        const input =
                            type === "from"
                                ? results.previousElementSibling
                                : results.previousElementSibling;

                        input.value = city.name;

                        results.replaceChildren();
                    }
                );

                results.append(button);
            });

        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            results.replaceChildren();

            const errorMessage =
                document.createElement("p");

            errorMessage.textContent =
                "Не удалось найти город.";

            results.append(errorMessage);
        }
    }

    showRoute(result) {
        if (!this.fromCity || !this.toCity) {
            result.replaceChildren();

            const message = document.createElement("p");

            message.textContent =
                "Сначала выберите город отправления и город назначения.";

            result.append(message);

            return;
        }

        if (this.fromCity.id === this.toCity.id) {
            result.replaceChildren();

            const message = document.createElement("p");

            message.textContent =
                "Выберите два разных города.";

            result.append(message);

            return;
        }

        const distance = this.calculateDistance(
            this.fromCity.latitude,
            this.fromCity.longitude,
            this.toCity.latitude,
            this.toCity.longitude
        );

        const routeDistance =
            Math.round(distance);

        const carTime =
            Math.max(1, Math.round(distance / 75));

        const trainTime =
            Math.max(2, Math.round(distance / 65));

        const planeTime =
            Math.max(1, Math.round(distance / 600));

        result.replaceChildren();

        const routeTitle =
            document.createElement("h4");

        routeTitle.textContent =
            `${this.fromCity.name} → ${this.toCity.name}`;

        const distanceElement =
            document.createElement("div");

        distanceElement.className =
            "route__distance";

        distanceElement.textContent =
            `${routeDistance.toLocaleString("ru-RU")} км`;

        const distanceLabel =
            document.createElement("p");

        distanceLabel.className =
            "route__distance-label";

        distanceLabel.textContent =
            "Расстояние между городами";

        const transportList =
            document.createElement("div");

        transportList.className =
            "route__transport";

        this.addTransport(
            transportList,
            "🚆",
            "Поезд",
            this.formatTime(trainTime)
        );

        this.addTransport(
            transportList,
            "🚗",
            "Автомобиль",
            this.formatTime(carTime)
        );

        this.addTransport(
            transportList,
            "✈️",
            "Самолёт",
            this.formatTime(planeTime)
        );

        const note =
            document.createElement("p");

        note.className = "route__note";

        note.textContent =
            "Время поездки указано ориентировочно и может отличаться в зависимости от конкретного маршрута.";

        const links =
            document.createElement("div");

        links.className = "route__links";

        const trainLink =
            document.createElement("a");

        trainLink.href =
            "https://www.rzd.ru/";

        trainLink.target = "_blank";
        trainLink.rel = "noopener noreferrer";

        trainLink.className =
            "route__ticket route__ticket--train";

        trainLink.textContent =
            "🚆 Купить билет на поезд";

        const planeLink =
            document.createElement("a");

        planeLink.href =
            "https://www.aviasales.ru/";

        planeLink.target = "_blank";
        planeLink.rel = "noopener noreferrer";

        planeLink.className =
            "route__ticket route__ticket--plane";

        planeLink.textContent =
            "✈️ Купить билет на самолёт";

        links.append(
            trainLink,
            planeLink
        );

        result.append(
            routeTitle,
            distanceElement,
            distanceLabel,
            transportList,
            note,
            links
        );
    }

    addTransport(container, icon, name, time) {
        const item =
            document.createElement("div");

        item.className =
            "route__transport-item";

        const iconElement =
            document.createElement("span");

        iconElement.className =
            "route__transport-icon";

        iconElement.textContent = icon;

        const nameElement =
            document.createElement("strong");

        nameElement.textContent = name;

        const timeElement =
            document.createElement("span");

        timeElement.textContent =
            `≈ ${time}`;

        item.append(
            iconElement,
            nameElement,
            timeElement
        );

        container.append(item);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371;

        const latDifference =
            this.toRadians(lat2 - lat1);

        const lonDifference =
            this.toRadians(lon2 - lon1);

        const a =
            Math.sin(latDifference / 2) ** 2 +
            Math.cos(this.toRadians(lat1)) *
            Math.cos(this.toRadians(lat2)) *
            Math.sin(lonDifference / 2) ** 2;

        const c =
            2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return earthRadius * c;
    }

    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    formatTime(hours) {
        if (hours < 1) {
            return `${Math.round(hours * 60)} мин`;
        }

        const wholeHours = Math.floor(hours);
        const minutes = Math.round(
            (hours - wholeHours) * 60
        );

        if (minutes === 0) {
            return `${wholeHours} ч`;
        }

        return `${wholeHours} ч ${minutes} мин`;
    }

    destroy() {
        if (this.fromController) {
            this.fromController.abort();
        }

        if (this.toController) {
            this.toController.abort();
        }

        super.destroy();
    }
}


/* ===== js/BudgetWidget.js ===== */

class BudgetWidget extends UIComponent {
    constructor(config) {
        super(config);

        this.expenses = [];
    }

    render() {
        const element = super.render();

        const header = document.createElement("div");
        header.className = "widget__header";

        const title = document.createElement("h3");
        title.textContent = this.title;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "widget__delete";
        deleteButton.textContent = "Удалить";

        this.addEventListener(deleteButton, "click", () => {
            this.close();
        });

        header.append(title, deleteButton);

        const amountInput = document.createElement("input");
        amountInput.type = "number";
        amountInput.className = "budget__input";
        amountInput.placeholder = "Сумма, ₽";
        amountInput.min = "0";

        const categorySelect = document.createElement("select");
        categorySelect.className = "budget__select";

        [
            "Транспорт",
            "Жильё",
            "Питание",
            "Развлечения",
            "Покупки",
            "Другое"
        ].forEach((category) => {
            const option = document.createElement("option");

            option.value = category;
            option.textContent = category;

            categorySelect.append(option);
        });

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "budget__add";
        addButton.textContent = "Добавить расход";

        const total = document.createElement("div");
        total.className = "budget__total";

        const totalLabel = document.createElement("span");
        totalLabel.textContent = "Всего расходов";

        const totalValue = document.createElement("strong");
        totalValue.textContent = "0 ₽";

        total.append(totalLabel, totalValue);

        const chart = document.createElement("div");
        chart.className = "budget__chart";

        const list = document.createElement("div");
        list.className = "budget__list";

        this.addEventListener(list, "click", (event) => {
            if (event.target.tagName !== "BUTTON") {
                return;
            }

            const item = event.target.closest(".budget__item");
            const index = Array.from(list.children).indexOf(item);

            if (index === -1) {
                return;
            }

            this.expenses.splice(index, 1);

            const totalValue =
                this.element.querySelector(
                    ".budget__total strong"
                );

            const chart =
                this.element.querySelector(
                    ".budget__chart"
                );

            this.updateBudget(
                totalValue,
                chart,
                list
            );
        });

        this.addEventListener(addButton, "click", () => {
            const amount = Number(amountInput.value);

            if (!amount || amount <= 0) {
                return;
            }

            this.expenses.push({
                amount,
                category: categorySelect.value
            });

            amountInput.value = "";

            this.updateBudget(
                totalValue,
                chart,
                list
            );
        });

        this.addEventListener(amountInput, "keydown", (event) => {
            if (event.key === "Enter") {
                addButton.click();
            }
        });

        element.append(
            header,
            amountInput,
            categorySelect,
            addButton,
            total,
            chart,
            list
        );

        return element;
    }

    updateBudget(totalValue, chart, list) {
        const total = this.expenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );

        totalValue.textContent =
            `${total.toLocaleString("ru-RU")} ₽`;

        this.updateChart(chart);
        this.updateList(list);
    }

    updateChart(chart) {
        chart.replaceChildren();

        if (this.expenses.length === 0) {
            return;
        }

        const categories = {};

        this.expenses.forEach((expense) => {
            categories[expense.category] =
                (categories[expense.category] || 0) +
                expense.amount;
        });

        const pie = document.createElement("div");
        pie.className = "budget__pie";

        let currentAngle = 0;

        const total = Object.values(categories)
            .reduce((sum, value) => sum + value, 0);

        const colors = [
            "#5da9e9",
            "#8fc7ee",
            "#dce5ed",
            "#1769aa",
            "#6f91aa",
            "#3c7198"
        ];

        const gradientParts = [];

        Object.values(categories).forEach(
            (value, index) => {
                const percentage =
                    (value / total) * 100;

                const start = currentAngle;
                const end =
                    currentAngle + percentage;

                gradientParts.push(
                    `${colors[index % colors.length]} ${start}% ${end}%`
                );

                currentAngle = end;
            }
        );

        pie.style.background =
            `conic-gradient(${gradientParts.join(", ")})`;

        chart.append(pie);

        const legend =
            document.createElement("div");

        legend.className = "budget__legend";

        Object.entries(categories).forEach(
            ([category, value], index) => {
                const item =
                    document.createElement("div");

                item.className = "budget__legend-item";

                const marker =
                    document.createElement("span");

                marker.className =
                    "budget__legend-marker";

                marker.style.background =
                    colors[index % colors.length];

                const text =
                    document.createElement("span");

                const percentage =
                    Math.round(
                        (value / total) * 100
                    );

                text.textContent =
                    `${category} — ${percentage}%`;

                item.append(marker, text);
                legend.append(item);
            }
        );

        chart.append(legend);
    }

    updateList(list) {
        list.replaceChildren();

        this.expenses.forEach((expense) => {
            const item = document.createElement("div");
            item.className = "budget__item";

            const info = document.createElement("div");

            const category = document.createElement("strong");
            category.textContent = expense.category;

            const amount = document.createElement("span");
            amount.textContent =
                `${expense.amount.toLocaleString("ru-RU")} ₽`;

            info.append(category, amount);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "×";
            deleteButton.title = "Удалить расход";

            item.append(info, deleteButton);
            list.append(item);
        });
    }
}


/* ===== js/AdviceWidget.js ===== */

class AdviceWidget extends UIComponent {
    constructor(config) {
        super(config);

        this.advices = [
            "Перед поездкой проверьте прогноз погоды в городе назначения.",
            "Составьте список необходимых вещей заранее, чтобы ничего не забыть.",
            "Сохраняйте билеты и документы в одном месте.",
            "Для длительной поездки заложите небольшой запас денег на непредвиденные расходы.",
            "Перед отправлением проверьте время отправления и прибытия транспорта.",
            "Если поездка длительная, заранее продумайте места для отдыха по пути.",
            "Сравните несколько вариантов транспорта перед покупкой билета.",
            "Сохраните адрес проживания и важные контакты, чтобы они были доступны без интернета."
        ];
    }

    render() {
        const element = super.render();

        const header = document.createElement("div");
        header.className = "widget__header";

        const title = document.createElement("h3");
        title.textContent = this.title;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "widget__delete";
        deleteButton.textContent = "Удалить";

        this.addEventListener(deleteButton, "click", () => {
            this.close();
        });

        header.append(title, deleteButton);

        const card = document.createElement("div");
        card.className = "advice__card";

        const icon = document.createElement("div");
        icon.className = "advice__icon";
        icon.textContent = "✦";

        const text = document.createElement("p");
        text.textContent =
            "Нажмите кнопку, чтобы получить совет для путешествия.";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "advice__button";
        button.textContent = "Получить совет";

        this.addEventListener(button, "click", () => {
            const randomIndex =
                Math.floor(
                    Math.random() * this.advices.length
                );

            text.textContent =
                this.advices[randomIndex];
        });

        card.append(
            icon,
            text
        );

        element.append(
            header,
            card,
            button
        );

        return element;
    }
}


/* ===== js/Dashboard.js ===== */

const STORAGE_KEY = "russia-traveler-dashboard-v2";
const TYPES = {
    todo: { Class: ToDoWidget, title: "🧳 Список вещей" },
    weather: { Class: WeatherWidget, title: "🌤 Погода" },
    place: { Class: PlaceWidget, title: "🏙️ Место для путешествия" },
    route: { Class: RouteWidget, title: "📍 Маршрут по России" },
    budget: { Class: BudgetWidget, title: "💰 Бюджет поездки" },
    advice: { Class: AdviceWidget, title: "✦ Совет путешественнику" }
};

class Dashboard {
    constructor(container) {
        this.container = container;
        this.widgets = new Map();
        this.nextId = 1;
        this.data = this.readStorage();
        this.restoreWidgets();
    }

    readStorage() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (error) {
            console.warn("Не удалось прочитать сохранённые данные.", error);
            return {};
        }
    }

    save() {
        const data = {
            widgets: Array.from(this.widgets.values()).map((widget) => ({
                type: widget.widgetType,
                id: widget.id,
                state: widget.getState()
            })),
            nextId: this.nextId,
            userName: document.querySelector("#user-name")?.value || this.data.userName || "",
            currentCity: this.data.currentCity || "",
            favorites: this.data.favorites || [],
            recentCities: this.data.recentCities || []
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            this.data = data;
        } catch (error) {
            console.warn("Не удалось сохранить данные в браузере.", error);
        }
    }

    restoreWidgets() {
        this.nextId = Math.max(1, Number(this.data.nextId) || 1);
        (this.data.widgets || []).forEach((saved) => {
            this.addWidget(saved.type, saved.state, saved.id, false);
        });
        if (this.widgets.size) this.save();
    }

    addWidget(type, state = {}, savedId = null, shouldSave = true) {
        const definition = TYPES[type];
        if (!definition) return;

        const id = savedId || `widget-${this.nextId}`;
        const widget = new definition.Class({
            title: definition.title,
            id,
            state,
            onStateChange: () => this.save(),
            onClose: (widgetId) => this.removeWidget(widgetId)
        });
        widget.widgetType = type;
        this.nextId = Math.max(this.nextId, Number(id.replace("widget-", "")) + 1 || this.nextId + 1);
        const element = widget.render();
        this.container.append(element);
        this.widgets.set(widget.id, widget);
        widget.restoreFields?.();
        if (state.minimized) {
            widget.isMinimized = false;
            widget.minimize();
            const button = element.querySelector(".widget__minimize");
            if (button) button.textContent = "Развернуть";
        }
        if (type === "todo" && state.items) {
            widget.items = state.items;
            const list = element.querySelector(".widget__list");
            if (list) widget.updateList(list);
            const titleInput = element.querySelector('input[placeholder="Название списка"]');
            const title = element.querySelector(".widget__header h3");
            if (state.listTitle && titleInput && title) {
                widget.listTitle = state.listTitle;
                titleInput.value = state.listTitle;
                title.textContent = state.listTitle;
            }
        }
        if (type === "budget" && state.expenses) {
            widget.expenses = state.expenses;
            widget.updateBudget(element.querySelector(".budget__total strong"), element.querySelector(".budget__chart"), element.querySelector(".budget__list"));
        }
        if (type === "advice" && state.adviceText) {
            const advice = element.querySelector(".advice__card p");
            if (advice) advice.textContent = state.adviceText;
        }
        if (shouldSave) this.save();
    }

    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        this.widgets.delete(widgetId);
        widget.destroy();
        this.save();
    }
}


/* ===== main.js ===== */

const widgetsContainer = document.querySelector("#widgets");
const dashboard = new Dashboard(widgetsContainer);
const widgetButtons = document.querySelectorAll("[data-widget]");
const userName = document.querySelector("#user-name");
const greeting = document.querySelector("#greeting");
const cityInput = document.querySelector("#global-city");
const favoritesContainer = document.querySelector("#favorite-cities");

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

import UIComponent from "./UIComponent.js";

export default class WeatherWidget extends UIComponent {
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
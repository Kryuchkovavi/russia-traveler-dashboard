import UIComponent from "./UIComponent.js";

export default class RouteWidget extends UIComponent {
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
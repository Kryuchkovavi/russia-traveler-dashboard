import UIComponent from "./UIComponent.js";

export default class PlaceWidget extends UIComponent {
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
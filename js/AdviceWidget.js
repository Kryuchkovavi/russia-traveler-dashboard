import UIComponent from "./UIComponent.js";

export default class AdviceWidget extends UIComponent {
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
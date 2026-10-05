import UIComponent from "./UIComponent.js";

export default class ToDoWidget extends UIComponent {
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
import UIComponent from "./UIComponent.js";

export default class BudgetWidget extends UIComponent {
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
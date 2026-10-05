import Dashboard from "./js/Dashboard.js";

const widgetsContainer = document.querySelector("#widgets");

const dashboard = new Dashboard(widgetsContainer);

const widgetButtons = document.querySelectorAll("[data-widget]");

widgetButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const widgetType = button.dataset.widget;

        dashboard.addWidget(widgetType);
    });
});
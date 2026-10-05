import ToDoWidget from "./ToDoWidget.js";
import WeatherWidget from "./WeatherWidget.js";
import PlaceWidget from "./PlaceWidget.js";
import RouteWidget from "./RouteWidget.js";
import BudgetWidget from "./BudgetWidget.js";
import AdviceWidget from "./AdviceWidget.js";

export default class Dashboard {
    constructor(container) {
        this.container = container;
        this.widgets = new Map();
        this.nextId = 1;
    }

    addWidget(type) {
        let widget;

        if (type === "todo") {
            widget = new ToDoWidget({
                title: "🧳 Список вещей",
                id: `widget-${this.nextId}`,
                onClose: (id) => this.removeWidget(id)
            });
        }

        if (type === "weather") {
            widget = new WeatherWidget({
                title: "🌤 Погода",
                id: `widget-${this.nextId}`,
                onClose: (id) => this.removeWidget(id)
            });
        }

        if (type === "place") {
            widget = new PlaceWidget({
                title: "🏙️ Место для путешествия",
                id: `widget-${this.nextId}`,
                onClose: (id) => this.removeWidget(id)
            });
        }

        if (type === "route") {
            widget = new RouteWidget({
                title: "📍 Маршрут по России",
                id: `widget-${this.nextId}`,
                onClose: (id) => this.removeWidget(id)
            });
        }

        if (type === "budget") {
            widget = new BudgetWidget({
                title: "💰 Бюджет поездки",
                id: `widget-${this.nextId}`,
                onClose: (id) => this.removeWidget(id)
            });
        }

        if (type === "advice") {
            widget = new AdviceWidget({
                title: "✦ Совет путешественнику",
                id: `widget-${this.nextId}`,
                onClose: (id) => this.removeWidget(id)
            });
        }

        if (!widget) {
            return;
        }

        this.nextId++;

        const element = widget.render();

        this.container.append(element);

        this.widgets.set(widget.id, widget);
    }

    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);

        if (!widget) {
            return;
        }

        this.widgets.delete(widgetId);
        widget.destroy();
    }
}
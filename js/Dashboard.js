import ToDoWidget from "./ToDoWidget.js";
import WeatherWidget from "./WeatherWidget.js";
import PlaceWidget from "./PlaceWidget.js";
import RouteWidget from "./RouteWidget.js";
import BudgetWidget from "./BudgetWidget.js";
import AdviceWidget from "./AdviceWidget.js";

const STORAGE_KEY = "russia-traveler-dashboard-v2";
const TYPES = {
    todo: { Class: ToDoWidget, title: "🧳 Список вещей" },
    weather: { Class: WeatherWidget, title: "🌤 Погода" },
    place: { Class: PlaceWidget, title: "🏙️ Место для путешествия" },
    route: { Class: RouteWidget, title: "📍 Маршрут по России" },
    budget: { Class: BudgetWidget, title: "💰 Бюджет поездки" },
    advice: { Class: AdviceWidget, title: "✦ Совет путешественнику" }
};

export default class Dashboard {
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

export default class UIComponent {
    constructor({ title, id, onClose }) {
        this.title = title;
        this.id = id;
        this.onClose = onClose;

        this.element = null;
        this.isMinimized = false;

        this.eventListeners = [];
    }

    render() {
        const element = document.createElement("div");

        element.className = "widget";
        element.dataset.widgetId = this.id;

        this.element = element;

        return element;
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
        element.addEventListener(event, handler);

        this.eventListeners.push({
            element,
            event,
            handler
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
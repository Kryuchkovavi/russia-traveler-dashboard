export default class UIComponent {
    constructor({ title, id, onClose, state = {}, onStateChange = () => {} }) {
        this.title = title;
        this.id = id;
        this.onClose = onClose;
        this.onStateChange = onStateChange;

        this.element = null;
        this.isMinimized = false;

        this.eventListeners = [];
        this.savedState = state || {};
    }

    render() {
        const element = document.createElement("div");

        element.className = "widget";
        element.dataset.widgetId = this.id;

        this.element = element;

        return element;
    }

    getState() {
        const fields = this.element
            ? Array.from(this.element.querySelectorAll("input, select, textarea")).map((field) => ({
                selector: field.className || field.type || field.tagName.toLowerCase(),
                type: field.type || "",
                value: field.value,
                checked: Boolean(field.checked)
            }))
            : [];

        return {
            minimized: this.isMinimized,
            fields,
            items: this.items,
            expenses: this.expenses,
            listTitle: this.listTitle,
            adviceText: this.element?.querySelector(".advice__card p")?.textContent || ""
        };
    }

    restoreFields() {
        if (!this.element || !this.savedState.fields) return;
        const fields = Array.from(this.element.querySelectorAll("input, select, textarea"));
        const used = new Set();
        this.savedState.fields.forEach((saved) => {
            const field = fields.find((candidate, index) => {
                if (used.has(index)) return false;
                const selector = candidate.className || candidate.type || candidate.tagName.toLowerCase();
                return selector === saved.selector && (candidate.type || "") === saved.type;
            });
            if (!field) return;
            used.add(fields.indexOf(field));
            field.value = saved.value ?? "";
            if (field.type === "checkbox") field.checked = Boolean(saved.checked);

        });
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
        const wrappedHandler = (...args) => {
            handler(...args);
            this.onStateChange();
        };
        element.addEventListener(event, wrappedHandler);

        this.eventListeners.push({
            element,
            event,
            handler: wrappedHandler
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
class ModalManager {
    constructor(modalElement, closeButton) {
        this.modal = modalElement;
        this.closeButton = closeButton;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeButton.onclick = () => this.hide();
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };
    }

    show() {
        this.modal.style.display = "block";
    }

    hide() {
        this.modal.style.display = "none";
    }
}

export default ModalManager; 
export default class AbstractView {
    constructor(params) {
        this.params = params;
    }

    setTitle(title) {
        document.title = title;
    }

    async getHtml() {
        return "";
    }
    
    // Optional method for post-render logic
    afterRender() {
        // Empty by default, can be overridden by child views
    }
} 
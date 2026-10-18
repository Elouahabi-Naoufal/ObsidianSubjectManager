const { ItemView } = require('obsidian');

class DashboardView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return 'subject-dashboard';
    }

    getDisplayText() {
        return 'Subject Dashboard';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h2', { text: 'Dashboard' });
    }
}

module.exports = { DashboardView };
const { Notice } = require('obsidian');

class CommandHandler {
    constructor(plugin) {
        this.plugin = plugin;
    }

    async createSubject(name, code, professor = '', credits = 0) {
        const id = Date.now().toString();
        this.plugin.subjects[id] = {
            id, name, code, professor,
            credits: parseInt(credits) || 0,
            archived: false,
            created: new Date().toISOString()
        };
        await this.plugin.saveSettings();
        new Notice(`Subject "${name}" created`);
        return id;
    }

    async createAssignment(name, subjectId, dueDate = null) {
        const id = Date.now().toString();
        this.plugin.assignments[id] = {
            id, name, subjectId, dueDate,
            completed: false,
            created: new Date().toISOString()
        };
        await this.plugin.saveSettings();
        new Notice(`Assignment "${name}" created`);
        return id;
    }

    async createProject(name, subjectId) {
        const id = Date.now().toString();
        this.plugin.projects[id] = {
            id, name, subjectId,
            status: 'planning',
            progress: 0,
            created: new Date().toISOString()
        };
        await this.plugin.saveSettings();
        new Notice(`Project "${name}" created`);
        return id;
    }

    async addTodo(task, subjectId = null, dueDate = null) {
        const id = Date.now().toString();
        this.plugin.todos[id] = {
            id, task, subjectId, dueDate,
            completed: false,
            created: new Date().toISOString()
        };
        await this.plugin.saveSettings();
        new Notice(`Todo "${task}" added`);
        return id;
    }

    async switchSubject(subjectId) {
        const subject = this.plugin.subjects[subjectId];
        if (subject) {
            this.plugin.activeSubject = subjectId;
            this.plugin.updateStatusBar();
            await this.plugin.saveSettings();
            new Notice(`Switched to ${subject.name}`);
            return true;
        }
        return false;
    }
}

module.exports = CommandHandler;
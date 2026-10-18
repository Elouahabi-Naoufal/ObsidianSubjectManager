class TemplateManager {
    constructor(plugin) {
        this.plugin = plugin;
    }

    getLectureTemplate(subject) {
        const date = new Date().toISOString().split('T')[0];
        return `# ${subject.name} - Lecture

**Date:** ${date}
**Subject:** ${subject.name} (${subject.code})

## Notes


---
Tags: #lecture #${subject.code.toLowerCase()}
`;
    }
}

module.exports = TemplateManager;
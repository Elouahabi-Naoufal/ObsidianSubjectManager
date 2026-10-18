class SearchManager {
    constructor(plugin) {
        this.plugin = plugin;
    }

    searchAll(query) {
        const results = {
            subjects: this.searchSubjects(query),
            assignments: this.searchAssignments(query),
            projects: this.searchProjects(query),
            exams: this.searchExams(query),
            todos: this.searchTodos(query),
            absences: this.searchAbsences(query)
        };
        return results;
    }

    searchSubjects(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.plugin.subjects).filter(subject =>
            subject.name.toLowerCase().includes(lowerQuery) ||
            subject.code.toLowerCase().includes(lowerQuery) ||
            subject.professor.toLowerCase().includes(lowerQuery)
        );
    }

    searchAssignments(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.plugin.assignments).filter(assignment => {
            const subject = this.plugin.subjects[assignment.subjectId];
            return assignment.name.toLowerCase().includes(lowerQuery) ||
                   (subject && subject.name.toLowerCase().includes(lowerQuery));
        });
    }

    searchProjects(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.plugin.projects).filter(project => {
            const subject = this.plugin.subjects[project.subjectId];
            return project.name.toLowerCase().includes(lowerQuery) ||
                   (subject && subject.name.toLowerCase().includes(lowerQuery));
        });
    }

    searchExams(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.plugin.exams).filter(exam => {
            const subject = this.plugin.subjects[exam.subjectId];
            return exam.name.toLowerCase().includes(lowerQuery) ||
                   (subject && subject.name.toLowerCase().includes(lowerQuery));
        });
    }

    searchTodos(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.plugin.todos).filter(todo => {
            const subject = this.plugin.subjects[todo.subjectId];
            return todo.task.toLowerCase().includes(lowerQuery) ||
                   (subject && subject.name.toLowerCase().includes(lowerQuery));
        });
    }

    searchAbsences(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.plugin.absences).filter(absence => {
            const subject = this.plugin.subjects[absence.subjectId];
            return absence.reason.toLowerCase().includes(lowerQuery) ||
                   absence.type.toLowerCase().includes(lowerQuery) ||
                   (subject && subject.name.toLowerCase().includes(lowerQuery));
        });
    }
}

module.exports = SearchManager;
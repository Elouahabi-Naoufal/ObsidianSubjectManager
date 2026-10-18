class AnalyticsManager {
    constructor(plugin) {
        this.plugin = plugin;
    }

    getSubjectStatistics(subjectId) {
        const subject = this.plugin.subjects[subjectId];
        if (!subject) return null;

        const assignments = Object.values(this.plugin.assignments).filter(a => a.subjectId === subjectId);
        const projects = Object.values(this.plugin.projects).filter(p => p.subjectId === subjectId);
        const exams = Object.values(this.plugin.exams).filter(e => e.subjectId === subjectId);
        const todos = Object.values(this.plugin.todos).filter(t => t.subjectId === subjectId);
        const absences = Object.values(this.plugin.absences).filter(a => a.subjectId === subjectId);

        return {
            subject: subject.name,
            assignments: {
                total: assignments.length,
                completed: assignments.filter(a => a.completed).length,
                pending: assignments.filter(a => !a.completed).length,
                overdue: assignments.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) < new Date()).length
            },
            projects: {
                total: projects.length,
                planning: projects.filter(p => p.status === 'planning').length,
                active: projects.filter(p => p.status === 'active').length,
                completed: projects.filter(p => p.status === 'completed').length
            },
            exams: {
                total: exams.length,
                upcoming: exams.filter(e => e.date && new Date(e.date) > new Date()).length,
                past: exams.filter(e => e.date && new Date(e.date) <= new Date()).length
            },
            todos: {
                total: todos.length,
                completed: todos.filter(t => t.completed).length,
                pending: todos.filter(t => !t.completed).length
            },
            absences: {
                total: absences.length,
                excused: absences.filter(a => a.type === 'excused').length,
                unexcused: absences.filter(a => a.type === 'unexcused').length,
                medical: absences.filter(a => a.type === 'medical').length
            }
        };
    }

    getOverallStatistics() {
        const allSubjects = Object.values(this.plugin.subjects);
        const activeSubjects = allSubjects.filter(s => !s.archived);
        
        const allAssignments = Object.values(this.plugin.assignments);
        const allProjects = Object.values(this.plugin.projects);
        const allExams = Object.values(this.plugin.exams);
        const allTodos = Object.values(this.plugin.todos);
        const allAbsences = Object.values(this.plugin.absences);

        return {
            subjects: {
                total: allSubjects.length,
                active: activeSubjects.length,
                archived: allSubjects.length - activeSubjects.length
            },
            assignments: {
                total: allAssignments.length,
                completed: allAssignments.filter(a => a.completed).length,
                pending: allAssignments.filter(a => !a.completed).length,
                overdue: allAssignments.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) < new Date()).length
            },
            projects: {
                total: allProjects.length,
                planning: allProjects.filter(p => p.status === 'planning').length,
                active: allProjects.filter(p => p.status === 'active').length,
                completed: allProjects.filter(p => p.status === 'completed').length
            },
            exams: {
                total: allExams.length,
                upcoming: allExams.filter(e => e.date && new Date(e.date) > new Date()).length,
                past: allExams.filter(e => e.date && new Date(e.date) <= new Date()).length
            },
            todos: {
                total: allTodos.length,
                completed: allTodos.filter(t => t.completed).length,
                pending: allTodos.filter(t => !t.completed).length
            },
            absences: {
                total: allAbsences.length,
                thisMonth: allAbsences.filter(a => this.isThisMonth(new Date(a.date))).length
            }
        };
    }

    getProductivityTrends() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentAssignments = Object.values(this.plugin.assignments)
            .filter(a => a.completed && new Date(a.created) >= thirtyDaysAgo);
        
        const recentTodos = Object.values(this.plugin.todos)
            .filter(t => t.completed && new Date(t.created) >= thirtyDaysAgo);

        const dailyCompletion = {};
        
        // Track daily completions
        recentAssignments.forEach(assignment => {
            const date = new Date(assignment.created).toDateString();
            dailyCompletion[date] = (dailyCompletion[date] || 0) + 1;
        });
        
        recentTodos.forEach(todo => {
            const date = new Date(todo.created).toDateString();
            dailyCompletion[date] = (dailyCompletion[date] || 0) + 1;
        });

        return {
            totalCompletions: recentAssignments.length + recentTodos.length,
            averagePerDay: (recentAssignments.length + recentTodos.length) / 30,
            dailyBreakdown: dailyCompletion
        };
    }

    isThisMonth(date) {
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }

    getUpcomingDeadlines(days = 7) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        const deadlines = [];

        // Add assignment deadlines
        Object.values(this.plugin.assignments).forEach(assignment => {
            if (!assignment.completed && assignment.dueDate) {
                const dueDate = new Date(assignment.dueDate);
                if (dueDate >= now && dueDate <= futureDate) {
                    const subject = this.plugin.subjects[assignment.subjectId];
                    deadlines.push({
                        type: 'Assignment',
                        name: assignment.name,
                        subject: subject?.name || 'Unknown',
                        date: assignment.dueDate,
                        daysUntil: Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000))
                    });
                }
            }
        });

        // Add exam dates
        Object.values(this.plugin.exams).forEach(exam => {
            if (exam.date) {
                const examDate = new Date(exam.date);
                if (examDate >= now && examDate <= futureDate) {
                    const subject = this.plugin.subjects[exam.subjectId];
                    deadlines.push({
                        type: 'Exam',
                        name: exam.name,
                        subject: subject?.name || 'Unknown',
                        date: exam.date,
                        daysUntil: Math.ceil((examDate - now) / (24 * 60 * 60 * 1000))
                    });
                }
            }
        });

        // Add todo deadlines
        Object.values(this.plugin.todos).forEach(todo => {
            if (!todo.completed && todo.dueDate) {
                const dueDate = new Date(todo.dueDate);
                if (dueDate >= now && dueDate <= futureDate) {
                    const subject = this.plugin.subjects[todo.subjectId];
                    deadlines.push({
                        type: 'Todo',
                        name: todo.task,
                        subject: subject?.name || 'Unknown',
                        date: todo.dueDate,
                        daysUntil: Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000))
                    });
                }
            }
        });

        return deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
    }
}

module.exports = AnalyticsManager;
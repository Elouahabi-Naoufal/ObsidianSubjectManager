class NotificationManager {
    constructor(plugin) {
        this.plugin = plugin;
        this.checkInterval = null;
    }

    start() {
        // Check for notifications every hour
        this.checkInterval = setInterval(() => {
            this.checkDeadlines();
        }, 60 * 60 * 1000);
        
        // Initial check
        this.checkDeadlines();
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    checkDeadlines() {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Check assignments
        Object.values(this.plugin.assignments).forEach(assignment => {
            if (!assignment.completed && assignment.dueDate) {
                const dueDate = new Date(assignment.dueDate);
                const subject = this.plugin.subjects[assignment.subjectId];
                
                if (this.isSameDay(dueDate, tomorrow)) {
                    this.showNotification(`Assignment "${assignment.name}" is due tomorrow in ${subject?.name || 'Unknown Subject'}`);
                } else if (dueDate <= nextWeek && dueDate > tomorrow) {
                    const daysUntil = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));
                    this.showNotification(`Assignment "${assignment.name}" is due in ${daysUntil} days in ${subject?.name || 'Unknown Subject'}`);
                }
            }
        });

        // Check exams
        Object.values(this.plugin.exams).forEach(exam => {
            if (exam.date) {
                const examDate = new Date(exam.date);
                const subject = this.plugin.subjects[exam.subjectId];
                
                if (this.isSameDay(examDate, tomorrow)) {
                    this.showNotification(`Exam "${exam.name}" is tomorrow in ${subject?.name || 'Unknown Subject'}`);
                } else if (examDate <= nextWeek && examDate > tomorrow) {
                    const daysUntil = Math.ceil((examDate - now) / (24 * 60 * 60 * 1000));
                    this.showNotification(`Exam "${exam.name}" is in ${daysUntil} days in ${subject?.name || 'Unknown Subject'}`);
                }
            }
        });

        // Check todos
        Object.values(this.plugin.todos).forEach(todo => {
            if (!todo.completed && todo.dueDate) {
                const dueDate = new Date(todo.dueDate);
                const subject = this.plugin.subjects[todo.subjectId];
                
                if (this.isSameDay(dueDate, tomorrow)) {
                    this.showNotification(`Todo "${todo.task}" is due tomorrow in ${subject?.name || 'Unknown Subject'}`);
                }
            }
        });
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    showNotification(message) {
        new Notice(message, 8000);
    }
}

module.exports = NotificationManager;
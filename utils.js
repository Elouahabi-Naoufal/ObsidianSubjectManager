class Utils {
    static formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    }

    static calculateProgress(completed, total) {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }

    static isOverdue(dueDate) {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    }

    static getDaysUntil(date) {
        if (!date) return null;
        const today = new Date();
        const target = new Date(date);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    static calculateGPA(assignments) {
        if (!assignments || assignments.length === 0) return 0;
        
        const gradedAssignments = assignments.filter(a => a.grade !== null && a.grade !== undefined);
        if (gradedAssignments.length === 0) return 0;

        const total = gradedAssignments.reduce((sum, a) => sum + parseFloat(a.grade), 0);
        return (total / gradedAssignments.length).toFixed(2);
    }

    static sortByPriority(items) {
        const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
        return items.sort((a, b) => (priorities[b.priority] || 2) - (priorities[a.priority] || 2));
    }
}

module.exports = Utils;
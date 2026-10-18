const { Plugin, Modal, Notice } = require('obsidian');

class SearchManager {
    constructor(plugin) {
        this.plugin = plugin;
    }

    searchAll(query) {
        const lowerQuery = query.toLowerCase();
        return {
            subjects: Object.values(this.plugin.subjects).filter(s => 
                s.name.toLowerCase().includes(lowerQuery) || s.code.toLowerCase().includes(lowerQuery)),
            assignments: Object.values(this.plugin.assignments).filter(a => 
                a.name.toLowerCase().includes(lowerQuery)),
            projects: Object.values(this.plugin.projects).filter(p => 
                p.name.toLowerCase().includes(lowerQuery)),
            exams: Object.values(this.plugin.exams).filter(e => 
                e.name.toLowerCase().includes(lowerQuery)),
            todos: Object.values(this.plugin.todos).filter(t => 
                t.task.toLowerCase().includes(lowerQuery)),
            absences: Object.values(this.plugin.absences).filter(a => 
                a.reason.toLowerCase().includes(lowerQuery))
        };
    }
}

class NotificationManager {
    constructor(plugin) {
        this.plugin = plugin;
        this.checkInterval = null;
    }

    start() {
        this.checkInterval = setInterval(() => this.checkDeadlines(), 60 * 60 * 1000);
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
        
        Object.values(this.plugin.assignments).forEach(assignment => {
            if (!assignment.completed && assignment.dueDate) {
                const dueDate = new Date(assignment.dueDate);
                if (this.isSameDay(dueDate, tomorrow)) {
                    new Notice(`Assignment "${assignment.name}" is due tomorrow`);
                }
            }
        });
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

class AnalyticsManager {
    constructor(plugin) {
        this.plugin = plugin;
    }

    getOverallStatistics() {
        const allSubjects = Object.values(this.plugin.subjects);
        const allAssignments = Object.values(this.plugin.assignments);
        const allProjects = Object.values(this.plugin.projects);
        const allExams = Object.values(this.plugin.exams);
        const allTodos = Object.values(this.plugin.todos);
        const allAbsences = Object.values(this.plugin.absences);

        return {
            subjects: {
                active: allSubjects.filter(s => !s.archived).length
            },
            assignments: {
                total: allAssignments.length,
                completed: allAssignments.filter(a => a.completed).length
            },
            projects: {
                total: allProjects.length,
                completed: allProjects.filter(p => p.status === 'completed').length
            },
            exams: {
                upcoming: allExams.filter(e => e.date && new Date(e.date) > new Date()).length
            },
            todos: {
                pending: allTodos.filter(t => !t.completed).length
            },
            absences: {
                total: allAbsences.length
            }
        };
    }

    getProductivityTrends() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentCompletions = Object.values(this.plugin.assignments)
            .filter(a => a.completed && new Date(a.created) >= thirtyDaysAgo).length +
            Object.values(this.plugin.todos)
            .filter(t => t.completed && new Date(t.created) >= thirtyDaysAgo).length;

        return {
            totalCompletions: recentCompletions,
            averagePerDay: recentCompletions / 30
        };
    }

    getUpcomingDeadlines(days = 7) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const deadlines = [];

        Object.values(this.plugin.assignments).forEach(assignment => {
            if (!assignment.completed && assignment.dueDate) {
                const dueDate = new Date(assignment.dueDate);
                if (dueDate >= now && dueDate <= futureDate) {
                    const subject = this.plugin.subjects[assignment.subjectId];
                    deadlines.push({
                        type: 'Assignment',
                        name: assignment.name,
                        subject: subject?.name || 'Unknown',
                        daysUntil: Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000))
                    });
                }
            }
        });

        return deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
    }
}

class SubjectManagerPlugin extends Plugin {
    async onload() {
        await this.loadSettings();
        
        this.subjects = this.settings.subjects || {};
        this.projects = this.settings.projects || {};
        this.assignments = this.settings.assignments || {};
        this.exams = this.settings.exams || {};
        this.todos = this.settings.todos || {};
        this.absences = this.settings.absences || {};
        this.activeSubject = this.settings.activeSubject || null;

        this.addRibbonIcon('graduation-cap', 'Subject Manager', () => {
            new DashboardModal(this.app, this).open();
        });

        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();

        this.searchManager = new SearchManager(this);
        this.notificationManager = new NotificationManager(this);
        this.analyticsManager = new AnalyticsManager(this);
        
        // Start notifications
        this.notificationManager.start();

        this.addCommand({
            id: 'open-dashboard',
            name: 'Open Dashboard',
            callback: () => new DashboardModal(this.app, this).open()
        });

        this.addCommand({
            id: 'create-template-note',
            name: 'Create Template Note',
            callback: () => new TemplateModal(this.app, this).open()
        });

        this.addCommand({
            id: 'switch-subject',
            name: 'Switch Subject',
            callback: () => new SubjectSwitcherModal(this.app, this).open()
        });

        this.addCommand({
            id: 'search-all',
            name: 'Search All Items',
            callback: () => new SearchModal(this.app, this).open()
        });

        this.addCommand({
            id: 'view-analytics',
            name: 'View Analytics',
            callback: () => new AnalyticsModal(this.app, this).open()
        });

        this.addCommand({
            id: 'manage-absences',
            name: 'Manage Absences',
            callback: () => new AbsenceListModal(this.app, this).open()
        });

        // Management Commands
        this.addCommand({
            id: 'manage-subjects',
            name: 'Manage Subjects',
            callback: () => new ManageModal(this.app, this, 'subjects').open()
        });

        this.addCommand({
            id: 'manage-assignments',
            name: 'Manage Assignments',
            callback: () => new ManageModal(this.app, this, 'assignments').open()
        });

        this.addCommand({
            id: 'manage-projects',
            name: 'Manage Projects',
            callback: () => new ManageModal(this.app, this, 'projects').open()
        });

        this.addCommand({
            id: 'manage-exams',
            name: 'Manage Exams',
            callback: () => new ManageModal(this.app, this, 'exams').open()
        });

        this.addCommand({
            id: 'manage-todos',
            name: 'Manage Todos',
            callback: () => new ManageModal(this.app, this, 'todos').open()
        });
    }

    updateStatusBar() {
        if (this.activeSubject && this.subjects[this.activeSubject]) {
            this.statusBarItem.setText(`📚 ${this.subjects[this.activeSubject].code}`);
        } else {
            this.statusBarItem.setText('📚 No Subject');
        }
    }

    async saveSettings() {
        this.settings.subjects = this.subjects;
        this.settings.projects = this.projects;
        this.settings.assignments = this.assignments;
        this.settings.exams = this.exams;
        this.settings.todos = this.todos;
        this.settings.absences = this.absences;
        this.settings.activeSubject = this.activeSubject;
        await this.saveData(this.settings);
    }

    async loadSettings() {
        this.settings = Object.assign({}, await this.loadData());
    }

    onunload() {
        this.notificationManager?.stop();
    }
}

class DashboardModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Subject Manager Dashboard' });

        const subjectsDiv = contentEl.createDiv('subjects-grid');
        subjectsDiv.createEl('h3', { text: 'Active Subjects' });
        
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                const subjectEl = subjectsDiv.createDiv('subject-card');
                subjectEl.createEl('h4', { text: `${subject.name} (${subject.code})` });
                subjectEl.createEl('p', { text: `Professor: ${subject.professor}` });
                
                const switchBtn = subjectEl.createEl('button', { text: 'Switch To' });
                switchBtn.onclick = () => {
                    this.plugin.activeSubject = id;
                    this.plugin.updateStatusBar();
                    this.plugin.saveSettings();
                    new Notice(`Switched to ${subject.name}`);
                    this.close();
                };
            }
        });

        const deadlinesDiv = contentEl.createDiv('deadlines');
        deadlinesDiv.createEl('h3', { text: 'Upcoming Deadlines' });
        
        const allDeadlines = [];
        Object.entries(this.plugin.assignments).forEach(([id, assignment]) => {
            if (!assignment.completed && assignment.dueDate) {
                allDeadlines.push({ type: 'Assignment', name: assignment.name, date: assignment.dueDate });
            }
        });

        allDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5)
            .forEach(item => {
                const itemEl = deadlinesDiv.createDiv('deadline-item');
                itemEl.createEl('span', { text: `${item.type}: ${item.name}` });
                itemEl.createEl('span', { text: item.date });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class SubjectModal extends Modal {
    constructor(app, plugin, subject) {
        super(app);
        this.plugin = plugin;
        this.subject = subject;
        this.isEdit = !!subject;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Subject' : 'Create Subject' });

        const form = contentEl.createDiv('subject-form');
        
        const nameInput = form.createEl('input', { type: 'text', placeholder: 'Subject Name' });
        const codeInput = form.createEl('input', { type: 'text', placeholder: 'Subject Code' });
        const professorInput = form.createEl('input', { type: 'text', placeholder: 'Professor' });
        const creditsInput = form.createEl('input', { type: 'number', placeholder: 'Credits' });

        if (this.isEdit) {
            nameInput.value = this.subject.name;
            codeInput.value = this.subject.code;
            professorInput.value = this.subject.professor;
            creditsInput.value = this.subject.credits;
        }

        const saveBtn = form.createEl('button', { text: 'Save' });
        saveBtn.onclick = async () => {
            // Input validation
            if (!nameInput.value.trim()) {
                new Notice('Subject name is required');
                return;
            }
            if (!codeInput.value.trim()) {
                new Notice('Subject code is required');
                return;
            }
            
            // Check for duplicate codes
            const existingSubject = Object.values(this.plugin.subjects).find(s => 
                s.code.toLowerCase() === codeInput.value.toLowerCase() && s.id !== (this.isEdit ? this.subject.id : null)
            );
            if (existingSubject) {
                new Notice('Subject code already exists');
                return;
            }

            const id = this.isEdit ? this.subject.id : Date.now().toString();
            const subjectData = {
                id,
                name: nameInput.value.trim(),
                code: codeInput.value.trim().toUpperCase(),
                professor: professorInput.value.trim(),
                credits: parseInt(creditsInput.value) || 0,
                archived: false,
                created: this.isEdit ? this.subject.created : new Date().toISOString()
            };
            
            // Handle folder operations
            if (this.isEdit) {
                // Rename folder if name or code changed
                const oldFolderName = `${this.subject.code.padStart(2, '0')} - ${this.subject.name.toUpperCase()}`;
                const newFolderName = `${subjectData.code.padStart(2, '0')} - ${subjectData.name.toUpperCase()}`;
                
                if (oldFolderName !== newFolderName) {
                    try {
                        const oldFolder = this.plugin.app.vault.getAbstractFileByPath(oldFolderName);
                        if (oldFolder) {
                            await this.plugin.app.vault.rename(oldFolder, newFolderName);
                        }
                    } catch (error) {
                        new Notice(`Error renaming folder: ${error.message}`);
                    }
                }
            } else {
                // Create folder for new subjects
                const folderName = `${subjectData.code.padStart(2, '0')} - ${subjectData.name.toUpperCase()}`;
                try {
                    const existingFolder = this.plugin.app.vault.getAbstractFileByPath(folderName);
                    if (!existingFolder) {
                        await this.plugin.app.vault.createFolder(folderName);
                    }
                } catch (error) {
                    new Notice(`Error creating folder: ${error.message}`);
                }
            }
            
            this.plugin.subjects[id] = subjectData;
            
            this.plugin.saveSettings();
            new Notice(`Subject ${this.isEdit ? 'updated' : 'created'}`);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class AssignmentModal extends Modal {
    constructor(app, plugin, assignment) {
        super(app);
        this.plugin = plugin;
        this.assignment = assignment;
        this.isEdit = !!assignment;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Assignment' : 'Create Assignment' });

        const form = contentEl.createDiv('assignment-form');
        
        const nameInput = form.createEl('input', { type: 'text', placeholder: 'Assignment Name' });
        
        const subjectSelect = form.createEl('select');
        subjectSelect.createEl('option', { text: 'Select Subject', value: '' });
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                subjectSelect.createEl('option', { text: `${subject.name} (${subject.code})`, value: id });
            }
        });

        const dueDateInput = form.createEl('input', { type: 'date' });

        if (this.isEdit) {
            nameInput.value = this.assignment.name;
            subjectSelect.value = this.assignment.subjectId;
            dueDateInput.value = this.assignment.dueDate;
        }

        const saveBtn = form.createEl('button', { text: 'Save' });
        saveBtn.onclick = () => {
            const id = this.isEdit ? this.assignment.id : Date.now().toString();
            this.plugin.assignments[id] = {
                id,
                name: nameInput.value,
                subjectId: subjectSelect.value,
                dueDate: dueDateInput.value,
                completed: this.isEdit ? this.assignment.completed : false,
                created: this.isEdit ? this.assignment.created : new Date().toISOString()
            };
            this.plugin.saveSettings();
            new Notice(`Assignment ${this.isEdit ? 'updated' : 'created'}`);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ProjectModal extends Modal {
    constructor(app, plugin, project) {
        super(app);
        this.plugin = plugin;
        this.project = project;
        this.isEdit = !!project;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Project' : 'Create Project' });

        const form = contentEl.createDiv('project-form');
        
        const nameInput = form.createEl('input', { type: 'text', placeholder: 'Project Name' });
        
        const subjectSelect = form.createEl('select');
        subjectSelect.createEl('option', { text: 'Select Subject', value: '' });
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                subjectSelect.createEl('option', { text: `${subject.name} (${subject.code})`, value: id });
            }
        });

        if (this.isEdit) {
            nameInput.value = this.project.name;
            subjectSelect.value = this.project.subjectId;
        }

        const saveBtn = form.createEl('button', { text: 'Save' });
        saveBtn.onclick = () => {
            const id = this.isEdit ? this.project.id : Date.now().toString();
            this.plugin.projects[id] = {
                id,
                name: nameInput.value,
                subjectId: subjectSelect.value,
                status: 'planning',
                progress: 0,
                created: this.isEdit ? this.project.created : new Date().toISOString()
            };
            this.plugin.saveSettings();
            new Notice(`Project ${this.isEdit ? 'updated' : 'created'}`);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ExamModal extends Modal {
    constructor(app, plugin, exam) {
        super(app);
        this.plugin = plugin;
        this.exam = exam;
        this.isEdit = !!exam;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Exam' : 'Create Exam' });

        const form = contentEl.createDiv('exam-form');
        
        const nameInput = form.createEl('input', { type: 'text', placeholder: 'Exam Name' });
        
        const subjectSelect = form.createEl('select');
        subjectSelect.createEl('option', { text: 'Select Subject', value: '' });
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                subjectSelect.createEl('option', { text: `${subject.name} (${subject.code})`, value: id });
            }
        });

        const dateInput = form.createEl('input', { type: 'date' });
        const timeInput = form.createEl('input', { type: 'time' });

        if (this.isEdit) {
            nameInput.value = this.exam.name;
            subjectSelect.value = this.exam.subjectId;
            dateInput.value = this.exam.date;
            timeInput.value = this.exam.time;
        }

        const saveBtn = form.createEl('button', { text: 'Save' });
        saveBtn.onclick = () => {
            const id = this.isEdit ? this.exam.id : Date.now().toString();
            this.plugin.exams[id] = {
                id,
                name: nameInput.value,
                subjectId: subjectSelect.value,
                date: dateInput.value,
                time: timeInput.value,
                created: this.isEdit ? this.exam.created : new Date().toISOString()
            };
            this.plugin.saveSettings();
            new Notice(`Exam ${this.isEdit ? 'updated' : 'created'}`);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class TodoModal extends Modal {
    constructor(app, plugin, todo) {
        super(app);
        this.plugin = plugin;
        this.todo = todo;
        this.isEdit = !!todo;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Todo' : 'Add Todo' });

        const form = contentEl.createDiv('todo-form');
        
        const taskInput = form.createEl('input', { type: 'text', placeholder: 'Task Description' });
        
        const subjectSelect = form.createEl('select');
        subjectSelect.createEl('option', { text: 'Select Subject', value: '' });
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                subjectSelect.createEl('option', { text: `${subject.name} (${subject.code})`, value: id });
            }
        });

        const dueDateInput = form.createEl('input', { type: 'date' });

        if (this.isEdit) {
            taskInput.value = this.todo.task;
            subjectSelect.value = this.todo.subjectId;
            dueDateInput.value = this.todo.dueDate;
        }

        const saveBtn = form.createEl('button', { text: 'Save' });
        saveBtn.onclick = () => {
            const id = this.isEdit ? this.todo.id : Date.now().toString();
            this.plugin.todos[id] = {
                id,
                task: taskInput.value,
                subjectId: subjectSelect.value,
                dueDate: dueDateInput.value,
                completed: this.isEdit ? this.todo.completed : false,
                created: this.isEdit ? this.todo.created : new Date().toISOString()
            };
            this.plugin.saveSettings();
            new Notice(`Todo ${this.isEdit ? 'updated' : 'added'}`);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class SubjectSwitcherModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Switch Subject' });

        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                const subjectEl = contentEl.createDiv('subject-item');
                subjectEl.createEl('span', { text: `${subject.name} (${subject.code})` });
                
                const switchBtn = subjectEl.createEl('button', { text: 'Switch' });
                switchBtn.onclick = () => {
                    this.plugin.activeSubject = id;
                    this.plugin.updateStatusBar();
                    this.plugin.saveSettings();
                    new Notice(`Switched to ${subject.name}`);
                    this.close();
                };
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class TemplateModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Create Template Note' });

        const form = contentEl.createDiv('template-form');
        
        const typeSelect = form.createEl('select');
        typeSelect.createEl('option', { text: 'Select Template Type', value: '' });
        typeSelect.createEl('option', { text: 'Lecture Notes', value: 'lecture' });
        typeSelect.createEl('option', { text: 'Assignment', value: 'assignment' });
        typeSelect.createEl('option', { text: 'Project', value: 'project' });
        typeSelect.createEl('option', { text: 'Exam Study Guide', value: 'exam' });
        typeSelect.createEl('option', { text: 'Lab Report', value: 'lab' });
        typeSelect.createEl('option', { text: 'Research Notes', value: 'research' });
        typeSelect.createEl('option', { text: 'Quick Note', value: 'quick' });
        typeSelect.createEl('option', { text: 'Meeting Notes', value: 'meeting' });
        typeSelect.createEl('option', { text: 'Study Session', value: 'study' });
        typeSelect.createEl('option', { text: 'Essay', value: 'essay' });
        typeSelect.createEl('option', { text: 'Presentation', value: 'presentation' });
        typeSelect.createEl('option', { text: 'Book Notes', value: 'book' });
        typeSelect.createEl('option', { text: 'Article Summary', value: 'article' });
        typeSelect.createEl('option', { text: 'Thesis Chapter', value: 'thesis' });
        typeSelect.createEl('option', { text: 'Case Study', value: 'case' });
        typeSelect.createEl('option', { text: 'Field Notes', value: 'field' });
        typeSelect.createEl('option', { text: 'Interview Notes', value: 'interview' });
        typeSelect.createEl('option', { text: 'Seminar Notes', value: 'seminar' });
        typeSelect.createEl('option', { text: 'Workshop Notes', value: 'workshop' });
        typeSelect.createEl('option', { text: 'Conference Notes', value: 'conference' });
        typeSelect.createEl('option', { text: 'Literature Review', value: 'literature' });
        typeSelect.createEl('option', { text: 'Methodology', value: 'methodology' });
        typeSelect.createEl('option', { text: 'Data Analysis', value: 'analysis' });
        typeSelect.createEl('option', { text: 'Reflection', value: 'reflection' });
        typeSelect.createEl('option', { text: 'Group Work', value: 'group' });
        typeSelect.createEl('option', { text: 'Peer Review', value: 'peer' });
        typeSelect.createEl('option', { text: 'Self Assessment', value: 'self-assessment' });
        typeSelect.createEl('option', { text: 'Course Syllabus', value: 'syllabus' });
        typeSelect.createEl('option', { text: 'Reading List', value: 'reading' });
        typeSelect.createEl('option', { text: 'Bibliography', value: 'bibliography' });
        typeSelect.createEl('option', { text: 'Glossary', value: 'glossary' });
        typeSelect.createEl('option', { text: 'Timeline', value: 'timeline' });
        typeSelect.createEl('option', { text: 'Mind Map', value: 'mindmap' });
        typeSelect.createEl('option', { text: 'Flashcards', value: 'flashcards' });
        typeSelect.createEl('option', { text: 'Practice Problems', value: 'practice' });
        typeSelect.createEl('option', { text: 'Solution Set', value: 'solutions' });
        typeSelect.createEl('option', { text: 'Cheat Sheet', value: 'cheatsheet' });
        typeSelect.createEl('option', { text: 'Formula Sheet', value: 'formulas' });
        typeSelect.createEl('option', { text: 'Concept Map', value: 'concept' });
        typeSelect.createEl('option', { text: 'Progress Report', value: 'progress' });
        typeSelect.createEl('option', { text: 'Weekly Review', value: 'weekly' });
        typeSelect.createEl('option', { text: 'Monthly Summary', value: 'monthly' });
        typeSelect.createEl('option', { text: 'Semester Plan', value: 'semester' });
        typeSelect.createEl('option', { text: 'Course Evaluation', value: 'evaluation' });

        const subjectSelect = form.createEl('select');
        subjectSelect.createEl('option', { text: 'Select Subject', value: '' });
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                subjectSelect.createEl('option', { text: `${subject.name} (${subject.code})`, value: id });
            }
        });

        const nameInput = form.createEl('input', { type: 'text', placeholder: 'Note Name (optional)' });

        const folderSelect = form.createEl('select');
        folderSelect.createEl('option', { text: 'Select Folder', value: '' });

        // Update folders when subject changes
        subjectSelect.onchange = () => {
            folderSelect.innerHTML = '';
            folderSelect.createEl('option', { text: 'Select Folder', value: '' });
            
            if (subjectSelect.value) {
                const subject = this.plugin.subjects[subjectSelect.value];
                const subjectFolderPath = `${subject.code.padStart(2, '0')} - ${subject.name.toUpperCase()}`;
                const subjectFolder = this.plugin.app.vault.getAbstractFileByPath(subjectFolderPath);
                
                if (subjectFolder && subjectFolder.children) {
                    folderSelect.createEl('option', { text: 'Root (no subfolder)', value: 'root' });
                    subjectFolder.children.forEach(child => {
                        if (child.children !== undefined) { // It's a folder
                            folderSelect.createEl('option', { text: child.name, value: child.name });
                        }
                    });
                } else {
                    folderSelect.createEl('option', { text: 'Root (no subfolder)', value: 'root' });
                }
            }
        };

        const createBtn = form.createEl('button', { text: 'Create Note' });
        createBtn.onclick = async () => {
            const templateType = typeSelect.value;
            const subjectId = subjectSelect.value;
            const noteName = nameInput.value;
            const targetFolder = folderSelect.value;

            if (!templateType) {
                new Notice('Please select a template type');
                return;
            }

            if (!subjectId) {
                new Notice('Please select a subject');
                return;
            }

            if (!targetFolder) {
                new Notice('Please select a folder');
                return;
            }

            const subject = this.plugin.subjects[subjectId];
            await this.createTemplateNote(templateType, subject, noteName, targetFolder);
            this.close();
        };
    }

    async createTemplateNote(templateType, subject, customName, targetFolder) {
        const TemplateManager = this.getTemplateManager();
        const templateManager = new TemplateManager(this.plugin);
        
        const additionalParams = {
            lectureNumber: this.getNextLectureNumber(subject),
            assignmentName: customName || 'New Assignment',
            projectName: customName || 'New Project',
            examName: customName || 'Exam',
            labNumber: this.getNextLabNumber(subject),
            topic: customName || 'Research Topic',
            meetingType: customName || 'Meeting'
        };

        try {
            const file = await templateManager.createTemplatedNote(templateType, subject, additionalParams);
            if (file) {
                new Notice(`Created ${templateType} note: ${file.name}`);
            }
        } catch (error) {
            new Notice(`Error creating template note: ${error.message}`);
        }
    }

    getTemplateManager() {
        // Template Manager class
        return class TemplateManager {
            constructor(plugin) {
                this.plugin = plugin;
            }

            getLectureTemplate(subject, lectureNumber = 1) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${subject.name} - Lecture ${lectureNumber}

**Date:** ${date}
**Professor:** ${subject.professor}
**Subject:** ${subject.name} (${subject.code})

## Topics Covered
- 

## Key Concepts
- 

## Notes


## Questions
- 

## Action Items
- [ ] 

---
Tags: #lecture #${subject.code.toLowerCase()}
`;
            }

            getAssignmentTemplate(subject, assignmentName) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${assignmentName}

**Subject:** ${subject.name} (${subject.code})
**Date Created:** ${date}
**Due Date:** 
**Priority:** Medium

## Requirements
- 

## Approach
1. 

## Progress
- [ ] Research
- [ ] Planning
- [ ] Implementation
- [ ] Review
- [ ] Submit

## Notes


## Resources
- 

---
Tags: #assignment #${subject.code.toLowerCase()}
`;
            }

            getProjectTemplate(subject, projectName) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${projectName}

**Subject:** ${subject.name} (${subject.code})
**Start Date:** ${date}
**Due Date:** 
**Status:** Planning

## Project Overview


## Objectives
1. 

## Milestones
- [ ] **Planning Phase** - 
- [ ] **Development Phase** - 
- [ ] **Testing Phase** - 
- [ ] **Documentation** - 
- [ ] **Submission** - 

## Team Members
- 

## Resources Needed
- 

## Timeline
| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
|       |            |          |        |

## Progress Log
### ${date}
- 

## Deliverables
- [ ] 

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
|      |        |            |

---
Tags: #project #${subject.code.toLowerCase()}
`;
            }

            getExamTemplate(subject, examName) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${examName} - Study Guide

**Subject:** ${subject.name} (${subject.code})
**Exam Date:** 
**Study Plan Created:** ${date}

## Topics to Cover
- [ ] 
- [ ] 
- [ ] 

## Study Schedule
### Week 1
- [ ] 

### Week 2
- [ ] 

### Final Review
- [ ] 

## Practice Questions
1. 

## Key Formulas/Concepts


## Study Materials
- 

## Mock Test Results
| Date | Score | Notes |
|------|-------|-------|
|      |       |       |

---
Tags: #exam #study-guide #${subject.code.toLowerCase()}
`;
            }

            getLabReportTemplate(subject, labNumber) {
                const date = new Date().toISOString().split('T')[0];
                return `# Lab ${labNumber} Report - ${subject.name}

**Subject:** ${subject.name} (${subject.code})
**Lab Date:** ${date}
**Partner(s):** 

## Objective


## Materials
- 

## Procedure
1. 

## Observations


## Data/Results


## Analysis


## Conclusion


## Questions
1. 

## References
- 

---
Tags: #lab-report #${subject.code.toLowerCase()}
`;
            }

            getResearchTemplate(subject, topic) {
                const date = new Date().toISOString().split('T')[0];
                return `# Research: ${topic}

**Subject:** ${subject.name} (${subject.code})
**Research Started:** ${date}

## Research Question


## Hypothesis


## Literature Review
### Key Sources
1. 

### Summary of Findings


## Methodology


## Data Collection
- [ ] 

## Analysis


## Findings


## Conclusion


## Future Work


## Bibliography
1. 

---
Tags: #research #${subject.code.toLowerCase()}
`;
            }

            getQuickNoteTemplate(subject) {
                const date = new Date().toISOString().split('T')[0];
                const time = new Date().toLocaleTimeString();
                return `# Quick Note - ${subject.name}

**Date:** ${date} ${time}
**Subject:** ${subject.name} (${subject.code})

## Notes


---
Tags: #quick-note #${subject.code.toLowerCase()}
`;
            }

            getMeetingTemplate(subject, meetingType = 'General') {
                const date = new Date().toISOString().split('T')[0];
                return `# ${meetingType} Meeting - ${subject.name}

**Date:** ${date}
**Subject:** ${subject.name} (${subject.code})
**Attendees:** 

## Agenda
1. 

## Discussion Points


## Decisions Made
- 

## Action Items
- [ ] 

## Next Meeting
**Date:** 
**Agenda:** 

---
Tags: #meeting #${subject.code.toLowerCase()}
`;
            }

            getStudySessionTemplate(subject) {
                const date = new Date().toISOString().split('T')[0];
                return `# Study Session - ${subject.name}

**Date:** ${date}
**Subject:** ${subject.name} (${subject.code})
**Duration:** 

## Goals for this session
- [ ] 

## Topics Studied
1. 

## Key Insights


## Questions Raised
- 

## Next Session Plan
- 

## Effectiveness Rating
/10

---
Tags: #study-session #${subject.code.toLowerCase()}
`;
            }

            getEssayTemplate(subject, title) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${title}

**Subject:** ${subject.name} (${subject.code})
**Date:** ${date}
**Word Count Target:** 
**Due Date:** 

## Thesis Statement


## Outline
### I. Introduction
- Hook:
- Background:
- Thesis:

### II. Body Paragraph 1
- Topic sentence:
- Evidence:
- Analysis:

### III. Body Paragraph 2
- Topic sentence:
- Evidence:
- Analysis:

### IV. Body Paragraph 3
- Topic sentence:
- Evidence:
- Analysis:

### V. Conclusion
- Restate thesis:
- Summary:
- Final thought:

## Sources
1. 

## Draft Notes


---
Tags: #essay #${subject.code.toLowerCase()}
`;
            }

            getPresentationTemplate(subject, title) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${title} - Presentation

**Subject:** ${subject.name} (${subject.code})
**Date:** ${date}
**Presentation Date:** 
**Duration:** 
**Audience:** 

## Objective


## Slide Outline
### Slide 1: Title
- Title: ${title}
- Presenter:
- Date:

### Slide 2: Agenda
- 

### Slide 3: Introduction
- 

### Slide 4-6: Main Content
- 

### Slide 7: Conclusion
- 

### Slide 8: Questions
- 

## Speaker Notes


## Visual Elements
- [ ] Charts/Graphs
- [ ] Images
- [ ] Videos
- [ ] Animations

## Equipment Needed
- [ ] Projector
- [ ] Laptop
- [ ] Clicker
- [ ] Microphone

---
Tags: #presentation #${subject.code.toLowerCase()}
`;
            }

            getBookNotesTemplate(subject, bookTitle, author) {
                const date = new Date().toISOString().split('T')[0];
                return `# Book Notes: ${bookTitle}

**Subject:** ${subject.name} (${subject.code})
**Author:** ${author}
**Date Started:** ${date}
**Date Finished:** 
**Rating:** /5

## Book Information
- **Genre:** 
- **Publication Year:** 
- **Pages:** 
- **ISBN:** 

## Summary


## Key Themes
1. 
2. 
3. 

## Important Quotes
> 

> 

## Chapter Notes
### Chapter 1:
- 

### Chapter 2:
- 

## Personal Reflections


## Connection to Course


## Discussion Questions
1. 
2. 
3. 

---
Tags: #book-notes #${subject.code.toLowerCase()}
`;
            }

            getArticleSummaryTemplate(subject, articleTitle, author) {
                const date = new Date().toISOString().split('T')[0];
                return `# Article Summary: ${articleTitle}

**Subject:** ${subject.name} (${subject.code})
**Author:** ${author}
**Date Read:** ${date}
**Publication:** 
**URL/DOI:** 

## Citation
${author}. "${articleTitle}." 

## Abstract/Summary


## Main Arguments
1. 
2. 
3. 

## Key Evidence
- 
- 
- 

## Methodology


## Findings/Results


## Strengths
- 
- 

## Limitations
- 
- 

## Relevance to Course


## Critical Analysis


## Questions for Further Research
1. 
2. 

---
Tags: #article-summary #${subject.code.toLowerCase()}
`;
            }

            getThesisChapterTemplate(subject, chapterTitle, chapterNumber) {
                const date = new Date().toISOString().split('T')[0];
                return `# Chapter ${chapterNumber}: ${chapterTitle}

**Subject:** ${subject.name} (${subject.code})
**Date:** ${date}
**Word Count Target:** 
**Status:** Draft

## Chapter Overview


## Learning Objectives
1. 
2. 
3. 

## Outline
### ${chapterNumber}.1 Introduction

### ${chapterNumber}.2 Literature Review

### ${chapterNumber}.3 Methodology

### ${chapterNumber}.4 Analysis

### ${chapterNumber}.5 Discussion

### ${chapterNumber}.6 Conclusion

## Key Arguments
1. 
2. 
3. 

## Evidence Required
- [ ] Statistical data
- [ ] Case studies
- [ ] Expert interviews
- [ ] Literature support

## References Needed
- 

## Writing Progress
- [ ] Outline complete
- [ ] First draft
- [ ] Peer review
- [ ] Supervisor feedback
- [ ] Final revision

## Notes


---
Tags: #thesis #chapter #${subject.code.toLowerCase()}
`;
            }

            getCaseStudyTemplate(subject, caseTitle) {
                const date = new Date().toISOString().split('T')[0];
                return `# Case Study: ${caseTitle}

**Subject:** ${subject.name} (${subject.code})
**Date:** ${date}
**Case Type:** 
**Industry/Context:** 

## Case Overview


## Background Information
### Company/Organization
- Name:
- Industry:
- Size:
- Location:

### Key Stakeholders
- 
- 
- 

## Problem Statement


## Analysis Framework
### SWOT Analysis
**Strengths:**
- 

**Weaknesses:**
- 

**Opportunities:**
- 

**Threats:**
- 

### Key Issues
1. 
2. 
3. 

## Alternative Solutions
### Option 1:
**Pros:**
- 

**Cons:**
- 

### Option 2:
**Pros:**
- 

**Cons:**
- 

### Option 3:
**Pros:**
- 

**Cons:**
- 

## Recommended Solution


## Implementation Plan
1. 
2. 
3. 

## Expected Outcomes


## Lessons Learned


---
Tags: #case-study #${subject.code.toLowerCase()}
`;
            }

            getFlashcardsTemplate(subject, topic) {
                const date = new Date().toISOString().split('T')[0];
                return `# Flashcards: ${topic}

**Subject:** ${subject.name} (${subject.code})
**Topic:** ${topic}
**Date Created:** ${date}
**Total Cards:** 

## Card Set 1: Definitions

**Q:** 
**A:** 

---

**Q:** 
**A:** 

---

**Q:** 
**A:** 

---

## Card Set 2: Concepts

**Q:** 
**A:** 

---

**Q:** 
**A:** 

---

## Card Set 3: Applications

**Q:** 
**A:** 

---

**Q:** 
**A:** 

---

## Study Schedule
- [ ] Day 1: Initial review
- [ ] Day 3: First repetition
- [ ] Day 7: Second repetition
- [ ] Day 14: Third repetition
- [ ] Day 30: Final review

## Performance Tracking
| Date | Correct | Incorrect | Accuracy |
|------|---------|-----------|----------|
|      |         |           |          |

---
Tags: #flashcards #${subject.code.toLowerCase()} #${topic.toLowerCase().replace(/\s+/g, '-')}
`;
            }

            getCheatSheetTemplate(subject, topic) {
                const date = new Date().toISOString().split('T')[0];
                return `# ${topic} - Cheat Sheet

**Subject:** ${subject.name} (${subject.code})
**Topic:** ${topic}
**Date:** ${date}

## Key Formulas

### Formula 1
\`\`\`
Formula here
\`\`\`
**When to use:** 
**Variables:** 

### Formula 2
\`\`\`
Formula here
\`\`\`
**When to use:** 
**Variables:** 

## Important Definitions

**Term 1:** 

**Term 2:** 

**Term 3:** 

## Key Concepts

1. **Concept 1**
   - 
   - 

2. **Concept 2**
   - 
   - 

## Common Mistakes

- ❌ 
- ❌ 
- ❌ 

## Quick Tips

- 💡 
- 💡 
- 💡 

## Examples

### Example 1
**Problem:** 
**Solution:** 

### Example 2
**Problem:** 
**Solution:** 

---
Tags: #cheat-sheet #${subject.code.toLowerCase()} #${topic.toLowerCase().replace(/\s+/g, '-')}
`;
            }

            getWeeklyReviewTemplate(subject, weekNumber) {
                const date = new Date().toISOString().split('T')[0];
                return `# Week ${weekNumber} Review - ${subject.name}

**Subject:** ${subject.name} (${subject.code})
**Week:** ${weekNumber}
**Date:** ${date}

## This Week's Accomplishments

### Lectures Attended
- [ ] Lecture 1: 
- [ ] Lecture 2: 
- [ ] Lecture 3: 

### Assignments Completed
- [ ] 
- [ ] 
- [ ] 

### Reading Completed
- [ ] 
- [ ] 
- [ ] 

## Key Learning Points

1. 
2. 
3. 

## Challenges Faced

- 
- 
- 

## Questions/Clarifications Needed

1. 
2. 
3. 

## Next Week's Goals

- [ ] 
- [ ] 
- [ ] 

## Study Time This Week

| Day | Hours | Topics Covered |
|-----|-------|----------------|
| Mon |       |                |
| Tue |       |                |
| Wed |       |                |
| Thu |       |                |
| Fri |       |                |
| Sat |       |                |
| Sun |       |                |

**Total Hours:** 

## Grade Updates

| Assignment | Grade | Comments |
|------------|-------|----------|
|            |       |          |

## Reflection

### What went well?


### What could be improved?


### Action items for next week

1. 
2. 
3. 

---
Tags: #weekly-review #${subject.code.toLowerCase()}
`;
            }

            async createTemplatedNote(templateType, subject, additionalParams = {}, targetFolder) {
                console.log('Debug - templateType:', templateType);
                console.log('Debug - subject:', subject);
                console.log('Debug - targetFolder:', targetFolder);
                console.log('Debug - targetFolder type:', typeof targetFolder);
                
                if (!targetFolder) {
                    new Notice('Please select a folder');
                    return null;
                }
                
                let content = '';
                let filename = '';
                const date = new Date().toISOString().split('T')[0];

                switch (templateType) {
                    case 'lecture':
                        content = this.getLectureTemplate(subject, additionalParams.lectureNumber);
                        filename = `${subject.code} - Lecture ${additionalParams.lectureNumber || 1} - ${date}`;
                        break;
                    case 'assignment':
                        content = this.getAssignmentTemplate(subject, additionalParams.assignmentName || 'Assignment');
                        filename = `${subject.code} - ${additionalParams.assignmentName || 'Assignment'} - ${date}`;
                        break;
                    case 'project':
                        content = this.getProjectTemplate(subject, additionalParams.projectName || 'Project');
                        filename = `${subject.code} - ${additionalParams.projectName || 'Project'} - ${date}`;
                        break;
                    case 'exam':
                        content = this.getExamTemplate(subject, additionalParams.examName || 'Exam');
                        filename = `${subject.code} - ${additionalParams.examName || 'Exam'} Study Guide - ${date}`;
                        break;
                    case 'lab':
                        content = this.getLabReportTemplate(subject, additionalParams.labNumber || 1);
                        filename = `${subject.code} - Lab ${additionalParams.labNumber || 1} Report - ${date}`;
                        break;
                    case 'research':
                        content = this.getResearchTemplate(subject, additionalParams.topic || 'Research Topic');
                        filename = `${subject.code} - Research ${additionalParams.topic || 'Topic'} - ${date}`;
                        break;
                    case 'quick':
                        content = this.getQuickNoteTemplate(subject);
                        filename = `${subject.code} - Quick Note - ${date}`;
                        break;
                    case 'meeting':
                        content = this.getMeetingTemplate(subject, additionalParams.meetingType);
                        filename = `${subject.code} - ${additionalParams.meetingType || 'Meeting'} - ${date}`;
                        break;
                    case 'study':
                        content = this.getStudySessionTemplate(subject);
                        filename = `${subject.code} - Study Session - ${date}`;
                        break;
                    case 'essay':
                        content = this.getEssayTemplate(subject, additionalParams.title || 'Essay');
                        filename = `${subject.code} - ${additionalParams.title || 'Essay'} - ${date}`;
                        break;
                    case 'presentation':
                        content = this.getPresentationTemplate(subject, additionalParams.title || 'Presentation');
                        filename = `${subject.code} - ${additionalParams.title || 'Presentation'} - ${date}`;
                        break;
                    case 'book':
                        content = this.getBookNotesTemplate(subject, additionalParams.bookTitle || 'Book', additionalParams.author || 'Author');
                        filename = `${subject.code} - Book Notes - ${additionalParams.bookTitle || 'Book'} - ${date}`;
                        break;
                    case 'article':
                        content = this.getArticleSummaryTemplate(subject, additionalParams.articleTitle || 'Article', additionalParams.author || 'Author');
                        filename = `${subject.code} - Article Summary - ${date}`;
                        break;
                    case 'thesis':
                        content = this.getThesisChapterTemplate(subject, additionalParams.chapterTitle || 'Chapter', additionalParams.chapterNumber || 1);
                        filename = `${subject.code} - Chapter ${additionalParams.chapterNumber || 1} - ${date}`;
                        break;
                    case 'case':
                        content = this.getCaseStudyTemplate(subject, additionalParams.caseTitle || 'Case Study');
                        filename = `${subject.code} - Case Study - ${date}`;
                        break;
                    case 'flashcards':
                        content = this.getFlashcardsTemplate(subject, additionalParams.topic || 'Topic');
                        filename = `${subject.code} - Flashcards - ${additionalParams.topic || 'Topic'} - ${date}`;
                        break;
                    case 'cheatsheet':
                        content = this.getCheatSheetTemplate(subject, additionalParams.topic || 'Topic');
                        filename = `${subject.code} - Cheat Sheet - ${date}`;
                        break;
                    case 'weekly':
                        content = this.getWeeklyReviewTemplate(subject, additionalParams.weekNumber || 1);
                        filename = `${subject.code} - Week ${additionalParams.weekNumber || 1} Review - ${date}`;
                        break;
                    default:
                        content = this.getQuickNoteTemplate(subject);
                        filename = `${subject.code} - Note - ${date}`;
                }

                try {
                    const baseFolderPath = `${subject.code.padStart(2, '0')} - ${subject.name.toUpperCase()}`;
                    
                    let folderPath;
                    if (targetFolder === 'root') {
                        folderPath = baseFolderPath;
                    } else {
                        folderPath = `${baseFolderPath}/${targetFolder}`;
                    }
                    
                    // Ensure folders exist
                    const baseFolder = this.plugin.app.vault.getAbstractFileByPath(baseFolderPath);
                    if (!baseFolder) {
                        await this.plugin.app.vault.createFolder(baseFolderPath);
                    }
                    
                    if (targetFolder !== 'root') {
                        const subFolder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
                        if (!subFolder) {
                            await this.plugin.app.vault.createFolder(folderPath);
                        }
                    }

                    const fullPath = `${folderPath}/${filename}.md`;
                    const file = await this.plugin.app.vault.create(fullPath, content);
                    
                    // Open the new note
                    const leaf = this.plugin.app.workspace.getUnpinnedLeaf();
                    await leaf.openFile(file);
                    
                    return file;
                } catch (error) {
                    console.error('Error creating templated note:', error);
                    return null;
                }
            }
        };
    }

    getNextLectureNumber(subject) {
        // Simple implementation - could be enhanced to check existing files
        return 1;
    }

    getNextLabNumber(subject) {
        // Simple implementation - could be enhanced to check existing files
        return 1;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class AbsenceModal extends Modal {
    constructor(app, plugin, absence) {
        super(app);
        this.plugin = plugin;
        this.absence = absence;
        this.isEdit = !!absence;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Absence' : 'Record Absence' });

        const form = contentEl.createDiv('absence-form');
        
        const subjectSelect = form.createEl('select');
        subjectSelect.createEl('option', { text: 'Select Subject', value: '' });
        Object.entries(this.plugin.subjects).forEach(([id, subject]) => {
            if (!subject.archived) {
                subjectSelect.createEl('option', { text: `${subject.name} (${subject.code})`, value: id });
            }
        });

        const dateInput = form.createEl('input', { type: 'date' });
        const reasonInput = form.createEl('input', { type: 'text', placeholder: 'Reason for absence' });
        
        const typeSelect = form.createEl('select');
        typeSelect.createEl('option', { text: 'Excused', value: 'excused' });
        typeSelect.createEl('option', { text: 'Unexcused', value: 'unexcused' });
        typeSelect.createEl('option', { text: 'Medical', value: 'medical' });
        typeSelect.createEl('option', { text: 'Emergency', value: 'emergency' });

        const notesInput = form.createEl('textarea', { placeholder: 'Additional notes' });
        notesInput.rows = 3;

        if (this.isEdit) {
            subjectSelect.value = this.absence.subjectId;
            dateInput.value = this.absence.date;
            reasonInput.value = this.absence.reason;
            typeSelect.value = this.absence.type;
            notesInput.value = this.absence.notes;
        }

        const saveBtn = form.createEl('button', { text: 'Save' });
        saveBtn.onclick = () => {
            const id = this.isEdit ? this.absence.id : Date.now().toString();
            this.plugin.absences[id] = {
                id,
                subjectId: subjectSelect.value,
                date: dateInput.value,
                reason: reasonInput.value,
                type: typeSelect.value,
                notes: notesInput.value,
                created: this.isEdit ? this.absence.created : new Date().toISOString()
            };
            this.plugin.saveSettings();
            new Notice(`Absence ${this.isEdit ? 'updated' : 'recorded'}`);
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class AbsenceListModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Absence Records' });

        const absenceList = contentEl.createDiv('absence-list');
        
        Object.entries(this.plugin.absences).forEach(([id, absence]) => {
            const subject = this.plugin.subjects[absence.subjectId];
            if (!subject) return;

            const absenceEl = absenceList.createDiv('absence-item');
            absenceEl.createEl('h4', { text: `${subject.name} (${subject.code})` });
            absenceEl.createEl('p', { text: `Date: ${absence.date}` });
            absenceEl.createEl('p', { text: `Type: ${absence.type}` });
            absenceEl.createEl('p', { text: `Reason: ${absence.reason}` });
            if (absence.notes) {
                absenceEl.createEl('p', { text: `Notes: ${absence.notes}` });
            }

            const actionsDiv = absenceEl.createDiv('actions');
            
            const editBtn = actionsDiv.createEl('button', { text: 'Edit' });
            editBtn.onclick = () => {
                this.close();
                new AbsenceModal(this.app, this.plugin, absence).open();
            };

            const deleteBtn = actionsDiv.createEl('button', { text: 'Delete' });
            deleteBtn.onclick = () => {
                delete this.plugin.absences[id];
                this.plugin.saveSettings();
                new Notice('Absence deleted');
                this.onOpen();
            };
        });

        if (Object.keys(this.plugin.absences).length === 0) {
            absenceList.createEl('p', { text: 'No absences recorded yet.' });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class SearchModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Search All Items' });

        const searchInput = contentEl.createEl('input', { type: 'text', placeholder: 'Search subjects, assignments, projects...' });
        searchInput.style.width = '100%';
        searchInput.style.marginBottom = '1rem';

        const resultsDiv = contentEl.createDiv('search-results');

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                resultsDiv.empty();
                return;
            }

            const results = this.plugin.searchManager.searchAll(query);
            this.displayResults(resultsDiv, results);
        });

        searchInput.focus();
    }

    displayResults(container, results) {
        container.empty();

        const categories = [
            { key: 'subjects', title: 'Subjects', items: results.subjects },
            { key: 'assignments', title: 'Assignments', items: results.assignments },
            { key: 'projects', title: 'Projects', items: results.projects },
            { key: 'exams', title: 'Exams', items: results.exams },
            { key: 'todos', title: 'Todos', items: results.todos },
            { key: 'absences', title: 'Absences', items: results.absences }
        ];

        categories.forEach(category => {
            if (category.items.length > 0) {
                const section = container.createDiv('search-section');
                section.createEl('h3', { text: category.title });
                
                category.items.forEach(item => {
                    const itemEl = section.createDiv('search-item');
                    
                    if (category.key === 'subjects') {
                        itemEl.createEl('span', { text: `${item.name} (${item.code})` });
                    } else {
                        const subject = this.plugin.subjects[item.subjectId];
                        const subjectName = subject ? `${subject.name} (${subject.code})` : 'Unknown Subject';
                        itemEl.createEl('span', { text: `${item.name || item.task} - ${subjectName}` });
                    }
                });
            }
        });

        if (Object.values(results).every(arr => arr.length === 0)) {
            container.createEl('p', { text: 'No results found.' });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class AnalyticsModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Analytics Dashboard' });

        const stats = this.plugin.analyticsManager.getOverallStatistics();
        const trends = this.plugin.analyticsManager.getProductivityTrends();
        const deadlines = this.plugin.analyticsManager.getUpcomingDeadlines();

        // Overall Statistics
        const statsSection = contentEl.createDiv('analytics-section');
        statsSection.createEl('h3', { text: 'Overall Statistics' });
        
        const statsGrid = statsSection.createDiv('stats-grid');
        
        this.createStatCard(statsGrid, stats.subjects.active, 'Active Subjects');
        this.createStatCard(statsGrid, `${stats.assignments.completed}/${stats.assignments.total}`, 'Assignments');
        this.createStatCard(statsGrid, `${stats.projects.completed}/${stats.projects.total}`, 'Projects');
        this.createStatCard(statsGrid, stats.exams.upcoming, 'Upcoming Exams');
        this.createStatCard(statsGrid, stats.todos.pending, 'Pending Todos');
        this.createStatCard(statsGrid, stats.absences.total, 'Total Absences');

        // Productivity Trends
        const trendsSection = contentEl.createDiv('analytics-section');
        trendsSection.createEl('h3', { text: 'Productivity (Last 30 Days)' });
        trendsSection.createEl('p', { text: `Total Completions: ${trends.totalCompletions}` });
        trendsSection.createEl('p', { text: `Average per Day: ${trends.averagePerDay.toFixed(1)}` });

        // Upcoming Deadlines
        const deadlinesSection = contentEl.createDiv('analytics-section');
        deadlinesSection.createEl('h3', { text: 'Upcoming Deadlines (Next 7 Days)' });
        
        if (deadlines.length === 0) {
            deadlinesSection.createEl('p', { text: 'No upcoming deadlines.' });
        } else {
            deadlines.forEach(deadline => {
                const deadlineEl = deadlinesSection.createDiv('deadline-item');
                deadlineEl.createEl('span', { text: `${deadline.type}: ${deadline.name} (${deadline.subject})` });
                deadlineEl.createEl('span', { text: `${deadline.daysUntil} days` });
            });
        }
    }

    createStatCard(container, value, label) {
        const card = container.createDiv('stat-card');
        card.createEl('span', { text: value.toString(), cls: 'stat-number' });
        card.createEl('div', { text: label, cls: 'stat-label' });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ConfirmDeleteModal extends Modal {
    constructor(app, onConfirm) {
        super(app);
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Confirm Deletion' });
        contentEl.createEl('p', { text: 'This will delete the subject and ALL its files permanently.' });
        
        const input = contentEl.createEl('input', { type: 'text', placeholder: 'Type "delete" to confirm' });
        input.style.width = '100%';
        input.style.margin = '1rem 0';
        
        const buttonsDiv = contentEl.createDiv();
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '1rem';
        
        const confirmBtn = buttonsDiv.createEl('button', { text: 'Delete' });
        confirmBtn.style.background = 'var(--text-error)';
        confirmBtn.style.color = 'white';
        confirmBtn.onclick = () => {
            if (input.value === 'delete') {
                this.close();
                this.onConfirm();
            } else {
                new Notice('Type "delete" to confirm');
            }
        };
        
        const cancelBtn = buttonsDiv.createEl('button', { text: 'Cancel' });
        cancelBtn.onclick = () => this.close();
        
        input.focus();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ManageModal extends Modal {
    constructor(app, plugin, type) {
        super(app);
        this.plugin = plugin;
        this.type = type;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: `Manage ${this.type.charAt(0).toUpperCase() + this.type.slice(1)}` });

        // CRUD Buttons
        const crudDiv = contentEl.createDiv('crud-buttons');
        
        const createBtn = crudDiv.createEl('button', { text: `Create New ${this.type.slice(0, -1)}` });
        createBtn.onclick = () => {
            this.close();
            this.openCreateModal();
        };

        const refreshBtn = crudDiv.createEl('button', { text: 'Refresh' });
        refreshBtn.onclick = () => this.onOpen();

        // Items List
        const items = Object.values(this.plugin[this.type]);
        
        if (items.length === 0) {
            contentEl.createEl('p', { text: `No ${this.type} found.` });
            return;
        }

        items.forEach(item => {
            const itemEl = contentEl.createDiv('list-item');
            
            if (this.type === 'subjects') {
                itemEl.createEl('h4', { text: `${item.name} (${item.code})` });
                itemEl.createEl('p', { text: `Professor: ${item.professor}` });
            } else {
                const subject = this.plugin.subjects[item.subjectId];
                itemEl.createEl('h4', { text: item.name || item.task });
                itemEl.createEl('p', { text: `Subject: ${subject?.name || 'Unknown'}` });
                if (item.dueDate) itemEl.createEl('p', { text: `Due: ${item.dueDate}` });
                if (item.completed !== undefined) itemEl.createEl('p', { text: `Status: ${item.completed ? 'Completed' : 'Pending'}` });
            }

            const actionsDiv = itemEl.createDiv('actions');
            
            const editBtn = actionsDiv.createEl('button', { text: 'Edit' });
            editBtn.onclick = () => {
                this.close();
                this.openEditModal(item);
            };

            const deleteBtn = actionsDiv.createEl('button', { text: 'Delete' });
            deleteBtn.onclick = async () => {
                if (this.type === 'subjects') {
                    new ConfirmDeleteModal(this.plugin.app, async () => {
                        // Delete subject folder - try multiple possible formats
                        const possibleNames = [
                            `${item.code.padStart(2, '0')} - ${item.name.toUpperCase()}`,
                            `${item.code.padStart(2, '0')} - ${item.name}`,
                            `${item.code} - ${item.name.toUpperCase()}`,
                            `${item.code} - ${item.name}`
                        ];
                        
                        let folderDeleted = false;
                        for (const folderName of possibleNames) {
                            try {
                                const folder = this.plugin.app.vault.getAbstractFileByPath(folderName);
                                if (folder) {
                                    await this.plugin.app.vault.delete(folder, true);
                                    folderDeleted = true;
                                    break;
                                }
                            } catch (error) {
                                // Try next format
                            }
                        }
                        
                        delete this.plugin[this.type][item.id];
                        this.plugin.saveSettings();
                        new Notice(`Subject deleted${folderDeleted ? ' with folder' : ''}`);
                        this.onOpen();
                    }).open();
                    return;
                }
                
                delete this.plugin[this.type][item.id];
                this.plugin.saveSettings();
                new Notice(`${this.type.slice(0, -1)} deleted`);
                this.onOpen();
            };
        });
    }

    openCreateModal() {
        switch (this.type) {
            case 'subjects':
                new SubjectModal(this.app, this.plugin, null).open();
                break;
            case 'assignments':
                new AssignmentModal(this.app, this.plugin, null).open();
                break;
            case 'projects':
                new ProjectModal(this.app, this.plugin, null).open();
                break;
            case 'exams':
                new ExamModal(this.app, this.plugin, null).open();
                break;
            case 'todos':
                new TodoModal(this.app, this.plugin, null).open();
                break;
        }
    }

    openEditModal(item) {
        switch (this.type) {
            case 'subjects':
                new SubjectModal(this.app, this.plugin, item).open();
                break;
            case 'assignments':
                new AssignmentModal(this.app, this.plugin, item).open();
                break;
            case 'projects':
                new ProjectModal(this.app, this.plugin, item).open();
                break;
            case 'exams':
                new ExamModal(this.app, this.plugin, item).open();
                break;
            case 'todos':
                new TodoModal(this.app, this.plugin, item).open();
                break;
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = SubjectManagerPlugin;
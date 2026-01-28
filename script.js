/**
 * Student Task Manager - Frontend Logic
 * Handles all DOM interactions, state management, and API communications.
 * Verified for performance and zero-dependency architecture.
 */

const API_BASE = 'http://localhost:3000';

// Global State
let tasks = [];
let studentProfile = null;

// --- DOM References ---
const profileForm = document.getElementById('profile-form');
const profileDisplay = document.getElementById('profile-display');
const btnEditProfile = document.getElementById('btn-edit-profile');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const taskInput = document.getElementById('task-input');
const btnAddTask = document.getElementById('btn-add-task');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const toastContainer = document.getElementById('toast-container');

// Input References
const inputName = document.getElementById('name');
const inputSchool = document.getElementById('school');
const inputClass = document.getElementById('class');
const inputRollNo = document.getElementById('rollno');

// Display References
const dispInitial = document.getElementById('display-initials');
const dispName = document.getElementById('display-name');
const dispSchool = document.getElementById('display-school');
const dispClass = document.getElementById('display-class');
const dispRoll = document.getElementById('display-rollno');

// --- Initialization ---

/**
 * Initialize application on page load.
 * Fetches initial data and sets up event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();
    fetchTasks();
    setupEventListeners();
});

function setupEventListeners() {
    // Profile Actions
    profileForm.addEventListener('submit', handleSaveProfile);
    btnEditProfile.addEventListener('click', () => toggleProfileMode(true));
    btnCancelEdit.addEventListener('click', () => toggleProfileMode(false));

    // Task Actions
    btnAddTask.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
}

// --- API Interactions ---

async function fetchProfile() {
    try {
        const res = await fetch(`${API_BASE}/student`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.name) {
                studentProfile = data;
                renderProfile();
                toggleProfileMode(false);
            } else {
                toggleProfileMode(true); // Show form if no profile
            }
        }
    } catch (err) {
        showToast('Failed to load profile', 'error');
        console.error(err);
    }
}

async function fetchTasks() {
    try {
        const res = await fetch(`${API_BASE}/tasks`);
        if (res.ok) {
            tasks = await res.json();
            renderTasks();
        }
    } catch (err) {
        showToast('Failed to load tasks', 'error');
        console.error(err);
    }
}

async function handleSaveProfile(e) {
    e.preventDefault();

    const newProfile = {
        name: inputName.value.trim(),
        school: inputSchool.value.trim(),
        class: inputClass.value.trim(),
        rollno: inputRollNo.value.trim()
    };

    if (!newProfile.name || !newProfile.school) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfile)
        });

        if (res.ok) {
            studentProfile = await res.json();
            renderProfile();
            toggleProfileMode(false);
            showToast('Profile saved successfully!', 'success');
        } else {
            throw new Error('Save failed');
        }
    } catch (err) {
        showToast('Error saving profile', 'error');
    }
}

async function handleAddTask() {
    const text = taskInput.value.trim();
    if (!text) {
        showToast('Task cannot be empty', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                completed: false // Default state
            })
        });

        if (res.ok) {
            const newTask = await res.json();
            tasks.push(newTask);
            renderTasks();
            taskInput.value = '';
            showToast('Task added successfully', 'success');
        }
    } catch (err) {
        showToast('Error adding task', 'error');
    }
}

async function handleToggleTask(id, currentStatus) {
    try {
        // Optimistic UI update
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !currentStatus;
            renderTasks();
        }

        const res = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !currentStatus })
        });

        if (!res.ok) {
            throw new Error('Update failed');
        }
    } catch (err) {
        // Revert on failure
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = currentStatus;
            renderTasks();
        }
        showToast('Error updating task', 'error');
    }
}

async function handleDeleteTask(id) {
    // Prevent bubbling from triggering row clicks if any
    if (window.event) window.event.stopPropagation();

    try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
            showToast('Task deleted', 'success');
        }
    } catch (err) {
        showToast('Error deleting task', 'error');
    }
}

// --- UI Rendering ---

function toggleProfileMode(isEdit) {
    if (isEdit) {
        profileForm.classList.remove('hidden');
        profileDisplay.classList.add('hidden');
        // Pre-fill form if data exists
        if (studentProfile) {
            inputName.value = studentProfile.name || '';
            inputSchool.value = studentProfile.school || '';
            inputClass.value = studentProfile.class || '';
            inputRollNo.value = studentProfile.rollno || '';
        }
    } else {
        profileForm.classList.add('hidden');
        profileDisplay.classList.remove('hidden');
    }
}

function renderProfile() {
    if (!studentProfile) return;

    dispName.textContent = studentProfile.name;
    dispSchool.textContent = studentProfile.school;
    dispClass.textContent = studentProfile.class;
    dispRoll.textContent = studentProfile.rollno;

    // Initials
    const initials = studentProfile.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    dispInitial.textContent = initials;
}

function renderTasks() {
    taskList.innerHTML = '';

    const activeCount = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${activeCount} Active`;

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <p>All caught up! No tasks pending.</p>
            </div>
        `;
        return;
    }

    // Sort: Incomplete first, then by newest
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(b.timestamp) - new Date(a.timestamp); // Newest first
        }
        return a.completed ? 1 : -1; // Completed last
    });

    sortedTasks.forEach(task => {
        const el = document.createElement('div');
        el.className = `task-item ${task.completed ? 'completed' : ''}`;

        const date = new Date(task.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Escape content
        const safeText = escapeHtml(task.text);

        el.innerHTML = `
            <div class="task-checkbox-container">
                <div class="task-checkbox" onclick="handleToggleTask('${task.id}', ${task.completed})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>
            <div class="task-content">
                <span class="task-text">${safeText}</span>
                <span class="task-meta">Added at ${timeString}</span>
            </div>
            <button class="btn-delete-icon" title="Delete Task" onclick="handleDeleteTask('${task.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        taskList.appendChild(el);
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // SVG Icons for Toast
    const icon = type === 'success'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    toast.innerHTML = `${icon} <span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utility
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Expose handlers globally
window.handleDeleteTask = handleDeleteTask;
window.handleToggleTask = handleToggleTask;

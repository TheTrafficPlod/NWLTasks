const db = firebase.database();
const tasksRef = db.ref('tasks'); // Remove forward slash

const modal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeBtn = document.querySelector('.close');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const developerFilter = document.getElementById('developerFilter');
const searchTask = document.getElementById('searchTask');
const taskStatus = document.getElementById('taskStatus');
const taskComments = document.getElementById('taskComments');

let tasks = [];
let showCompleted = false;
const toggleBtn = document.getElementById('toggleCompleted');

const currentUser = sessionStorage.getItem('currentUser');
const userAvatars = {
    'A.Mars': 'https://ui-avatars.com/api/?name=Mars&background=4f46e5&color=fff',
    'N.Henderson': 'https://ui-avatars.com/api/?name=Nicholas&background=818cf8&color=fff',
    'T.Mills': 'https://ui-avatars.com/api/?name=Mills&background=3730a3&color=fff'
};

const userRoles = {
    'A.Mars': 'Development and Progression Manager',
    'N.Henderson': 'Development Supervision',
    'T.Mills': 'Developer'
};

document.getElementById('userAvatar').src = userAvatars[currentUser] || 'https://ui-avatars.com/api/?name=User';
document.getElementById('sidebarUserName').textContent = currentUser;
document.getElementById('userDisplay').textContent = currentUser;
document.querySelector('.text-muted').textContent = userRoles[currentUser] || 'Developer';

function updateDashboardStats() {
    const stats = {
        awaitingDevMgr: 0,
        awaiting: 0,
        current: 0,
        complete: 0,
        onhold: 0
    };

    tasks.forEach(task => {
        const status = task.status.toLowerCase();

        if (status === 'awaiting development manager') {
            stats.awaitingDevMgr++;
        } else if (status === 'awaiting development' || status === 'awaiting review and completion' || status.includes('awaiting')) {
            stats.awaiting++;
        } else if (status === 'current (project)' || status.includes('current')) {
            stats.current++;
        } else if (status === 'complete' || status.includes('complete')) {
            stats.complete++;
        } else if (status === 'on hold' || status.includes('hold')) {
            stats.onhold++;
        }
    });

    document.getElementById('awaitingDevMgr').textContent = stats.awaitingDevMgr;
    document.getElementById('awaitingCount').textContent = stats.awaiting;
    document.getElementById('inProgressCount').textContent = stats.current;
    document.getElementById('completedCount').textContent = stats.complete;
    document.getElementById('onHoldCount').textContent = stats.onhold;
}


function updateUserStats() {
    const userTasks = tasks.filter(task => task.assignedTo === currentUser);
    
    const stats = {
        assigned: userTasks.filter(t => t.status !== 'Complete').length,
        inProgress: userTasks.filter(t => t.status === 'Current (Project)').length,
        completed: userTasks.filter(t => t.status === 'Complete').length
    };

    document.getElementById('userAssignedCount').textContent = stats.assigned;
    document.getElementById('userProgressCount').textContent = stats.inProgress;
    document.getElementById('userCompletedCount').textContent = stats.completed;
}

addTaskBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    taskForm.reset();
    taskStatus.value = 'Awaiting Development and Review';
    taskStatus.disabled = true;
    taskComments.disabled = false;
    if (!taskForm.dataset.editId) {
        document.getElementById('assignedTo').value = 'Anyone';
        document.getElementById('taskPriority').value = 'Low';
    }
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    taskForm.dataset.editId = '';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        taskForm.dataset.editId = '';
    }
});

function initializeDeveloperFilter() {
    const developers = ['Anyone', ...new Set(tasks.map(task => task.assignedTo))];
    developerFilter.innerHTML = '<option value="all">All Developers</option>';
    developers.forEach(developer => {
        if (developer) {
            developerFilter.innerHTML += `<option value="${developer}">${developer}</option>`;
        }
    });
}

statusFilter.addEventListener('change', renderTasks);
priorityFilter.addEventListener('change', renderTasks);
developerFilter.addEventListener('change', renderTasks);
searchTask.addEventListener('input', renderTasks);

toggleBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    toggleBtn.classList.toggle('expanded');
    
    const completedTasks = document.querySelectorAll('tr.completed-task');
    completedTasks.forEach(task => {
        task.classList.toggle('show');
    });
    
    toggleBtn.innerHTML = `
        <i class="fas fa-chevron-down"></i>
        ${showCompleted ? 'Hide' : 'Show'} Completed Tasks
    `;
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTask = {
        id: taskForm.dataset.editId || Date.now().toString(),
        title: document.getElementById('taskTitle').value.trim(),
        priority: document.getElementById('taskPriority').value || 'Medium',
        assignedTo: document.getElementById('assignedTo').value,
        status: taskForm.dataset.editId ? document.getElementById('taskStatus').value : 'Awaiting Development/Review',
        comments: document.getElementById('taskComments').value.trim() || '',
        dateAdded: taskForm.dataset.editId ? tasks.find(t => t.id === taskForm.dataset.editId)?.dateAdded : new Date().toLocaleDateString('en-GB'),
        lastUpdated: new Date().toISOString()
    };

    tasksRef.child(newTask.id).set(newTask)
        .then(() => {
            taskForm.reset();
            modal.style.display = 'none';
            taskForm.dataset.editId = '';
        })
        .catch((error) => {
            console.error("Error saving task: ", error);
            alert('Error saving task. Please try again.');
        });
});

function getStatusClass(status) {
    const statusMap = {
        'Awaiting Development Manager': 'awaiting dev mgr',
        'Complete': 'complete',
        'Current (Project)': 'current',
        'Awaiting Development': 'awaiting',
        'On Hold': 'onhold'
    };
    return statusMap[status] || '';
}

function getStatusIcon(status) {
    const iconMap = {
        'Complete': 'fas fa-check-circle',
        'Current (Project)': 'fas fa-code-branch',
        'Awaiting Development': 'fas fa-clock',
        'On Hold': 'fas fa-pause-circle'
    };
    return iconMap[status] || 'fas fa-info-circle';
}

function getPriorityClass(priority) {
    if (!priority) return 'priority-medium';
    return `priority-${priority.toLowerCase()}`;
}

function getPriorityIcon(priority) {
    const iconMap = {
        'High': 'fas fa-arrow-up',
        'Medium': 'fas fa-equals',
        'Low': 'fas fa-arrow-down'
    };
    return iconMap[priority] || 'fas fa-equals';
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskPriority').value = task.priority || 'Medium';
    document.getElementById('assignedTo').value = task.assignedTo || 'Anyone';
    document.getElementById('taskStatus').value = task.status || 'Awaiting Development';
    document.getElementById('taskComments').value = task.comments || '';
    
    taskStatus.disabled = false;
    taskComments.disabled = false;
    
    taskForm.dataset.editId = id;
    modal.style.display = 'block';
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasksRef.child(id).remove()
            .catch((error) => {
                console.error("Error deleting task: ", error);
                alert('Error deleting task. Please try again.');
            });
    }
}

function renderTasks() {
    const statusValue = statusFilter.value.toLowerCase();
    const priorityValue = priorityFilter.value.toLowerCase();
    const developerValue = developerFilter.value;
    const searchValue = searchTask.value.toLowerCase();

    const filteredTasks = tasks.filter(task => {
        if (!task) return false;
        return (statusValue === 'all' || task.status.toLowerCase().includes(statusValue)) &&
               (priorityValue === 'all' || task.priority.toLowerCase() === priorityValue) &&
               (developerValue === 'all' || task.assignedTo === developerValue) &&
               ((task.title && task.title.toLowerCase().includes(searchValue)) ||
                (task.comments && task.comments.toLowerCase().includes(searchValue)));
    });

    taskList.innerHTML = filteredTasks.length ? filteredTasks.map(task => `
        <tr class="${task.status === 'Complete' ? 'completed-task' + (showCompleted ? ' show' : '') : ''}">
            <td>${task.dateAdded}</td>
            <td>${task.title || ''}</td>
            <td><span class="priority ${getPriorityClass(task.priority)}">
                <i class="${getPriorityIcon(task.priority)}"></i>${task.priority || 'Medium'}</span></td>
            <td>${task.assignedTo || 'Anyone'}</td>
            <td><span class="status-${getStatusClass(task.status)}">
                <i class="${getStatusIcon(task.status)}"></i>${task.status}</span></td>
            <td>${task.comments || ''}</td>
            <td class="action-buttons">
                <button onclick="editTask('${task.id}')" class="btn-edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteTask('${task.id}')" class="btn-delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7">No tasks found</td></tr>';
}

tasksRef.on('value', (snapshot) => {
    tasks = [];
    snapshot.forEach((childSnapshot) => {
        const task = childSnapshot.val();
        task.id = childSnapshot.key;
        tasks.push(task);
    });
    renderTasks();
    initializeDeveloperFilter();
    updateDashboardStats();
    updateUserStats();
}, (error) => {
    console.error('Data fetch error:', error);
});

function signOut() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

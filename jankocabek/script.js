/* closure for dynamically generating the right request for each call
*also to have generating headers and other similar stuff in one place
*/
const api = () => {
    const apikey = '134d015d-5119-4142-af6f-1188e56feb36';
    const apiBaseUrl = 'https://todo-api.coderslab.pl/api/';

    function request(method, address, data = null) {
        return new Request(apiBaseUrl + address, {
            method: method,
            headers: {'Authorization': apikey, 'Content-Type': 'application/json'},
            body: data ? JSON.stringify(data) : null
        })
    }

    return {
        getTasks: () => request('GET', 'tasks'),
        getOperationsForTask: (taskId) => request('GET', `tasks/${taskId}/operations`),
        addTask: (taskData) => request('POST', 'tasks', taskData),
        deleteTask: (taskId) => request('DELETE', `tasks/${taskId}`),
        addOperation: (taskId, operationData) => request('POST', `tasks/${taskId}/operations`, operationData),
        updateOperation: (operationId, operationData) => request('PUT', `operations/${operationId}`, operationData),
        deleteOperation: (operationId) => request('DELETE', `operations/${operationId}`),
        finishTask: (taskId, taskData) => request('PUT', `tasks/${taskId}`, taskData),
    }
};

/**
 * main event which start after page load
 * @see {@link apiListTask} fetch and return all saved tasks from backend
 * @see {@link render} create an object representing DOM
 */
document.addEventListener('DOMContentLoaded', function () {
    //  const apiInstance = api();
    apiListTask()
        .then(task => renderTask(task))
        .then(tasksData => {
            tasksData.forEach((task) => {
                // console.log("given task: ", task)
                apiListOperationForTask(task.id)
                    .then(operations => {
                        // console.log("given operations: ", operations)
                        renderOperations(operations, task);
                    })
            })
        })
        .catch(error => console.log(error));
    addTaskFromForm();

});

/**
 *this promise returns the array with all tasks
 * @returns {Promise<object[]>}
 */
function apiListTask() {
    return fetch(api().getTasks()).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json()
    }).then(obj => {
        if (obj.error !== false) throw new Error('something went wrong with data');
        console.log(obj);
        return obj.data
    }).catch(error => console.log(error));
    // return getData(source)
}

function apiListOperationForTask(taskId) {
    return fetch(api().getOperationsForTask(taskId)).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json()
    }).then(obj => {
        if (obj.error !== false) throw new Error('something went wrong with data');
        // console.log('operations data: ', obj.data);
        return Array.from(obj.data);
    }).catch(error => console.log(error));
}

function apiCreateTask(task) {
    return fetch(api().addTask(task)).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json()
    }).then(obj => {
        if (obj.error !== false) throw new Error('something went wrong with data');
        console.log('new task add: ', obj.data);
        return [obj.data];//this and array.of() works dont use Array.from on not iterable things new.Array() have different result on numbers
    }).catch(error => console.log(error));
    // return getData(source,task)
}

function apiDeleteTask(id) {
    return fetch(api().deleteTask(id))
}

function createOperationForTask(taskId, description) {
    return fetch(api().addOperation(taskId, description))
}

function apiUpdateOperation(id, operationData) {
    return fetch(api().updateOperation(id, operationData))
}

function apiDeleteOperation(operationId) {
    return fetch(api().deleteOperation(operationId))
}

function apiUpdateTask(taskId, taskData) {
    return fetch(api().finishTask(taskId, taskData))
}

function addTaskFromForm() {
    const form = document.getElementsByTagName('form')[0];
    form.addEventListener('submit', (evt) => {
        evt.preventDefault();
        // console.log(form.elements.namedItem('title').value)
        const task = {
            title: form.elements.namedItem('title').value,
            description: form.elements.namedItem('description').value,
            status: 'open'
        }
        //apiInstance.apiCreateTask, task
        apiCreateTask(task).then(task => renderTask(task))
    })
}

/**
 * Fetches data using a request function from the API closure.
 * @param {function(object=): Request} source - A function returning a Request object, such as {@link api.getTasks}.
 * @param task {object}could be a object that contains new task or other data given into system
 * @returns {Promise<object[]>} A promise resolving to an array of objects. for us is task or tasks from given source
 * @see {@link api} for available request functions.
 */
function getData(source, task = null) {
    const request = task ? source(task) : source();
    return fetch(request).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json()
    }).then(obj => {
        if (obj.error !== false) throw new Error('something went wrong with data');
        //console.log('data is here',obj);
        return Array.isArray(obj.data) ? obj.data : [obj.data];
    }).catch(error => console.log(error));
}

/**
 *
 * render HTML card for every given task
 * @param tasks {object[]}
 * @returns {object}
 */
function renderTask(tasks) {
    const mainElement = document.getElementById('app');
    return tasks.map(task => {
        const taskCard = new TaskCard(task);
        mainElement.appendChild(taskCard.render());
        return {
            id: task.id,
            list: taskCard.list,
            operations: taskCard.operations,
        }
    });
}

/**
 *
 * @param operations {Array}
 * @param taskData {{taskId:string},{list:HTMLUListElement},{operations:array}}
 */
function renderOperations(operations, taskData) {
    operations.forEach(operation => {
        const list = taskData.list;
        const item = new OperationItem(operation);
        taskData.operations.push(item);
        list.append(item.render());
    })
}

/* section of event handlers*/

function deleteTaskHandler(evt, obj) {
    evt.preventDefault();
    const id = obj.id;
    console.log('deleting task: ', id, '')
    apiDeleteTask(id).then(response => {
        if (!response.ok) {
            console.log(response)
            throw new Error('Network response was not ok\n');

        } else {
            //console.log('deleting task: ', id, 'was successful')
            evt.target.closest('section').remove();
            obj = null;//remove reference to the obj of the task!!!!
        }
    }).catch(error => console.log(error));


}

function addOperationHandler(evt, taskObj) {
    evt.preventDefault();
    const id = taskObj.id;
    const description = taskObj.textInput.value;
    console.log('adding operation: ', description, 'for task: ', id, '')
    const operation = {
        description: description,
        timeSpent: 0
    }
    // console.log(description)
    createOperationForTask(id, operation).then(response => {
        if (response.ok === false) {
            console.log(response)
            throw new Error('Network response was not ok' + response);
        }
        return response.json()
    }).then(obj => {
        if (obj.error === true) {
            console.log('ERROR: ', obj)
            throw new Error('something went wrong with data');
        }
        const item = new OperationItem(obj.data);
        taskObj.operations.push(item);
        console.log('new operation added\n', 'list of operations:', '\n', taskObj.operations);
        taskObj.list.append(item.render());
    }).catch(error => console.log(error));
    evt.target.closest('form').reset();
}

/**
 *
 * @param evt
 * @param obj {object} operation object
 * @param addTime {number} added time in minutes
 */
function updateOperationHandler(evt, obj, addTime) {
    evt.preventDefault();
    const description = obj.description;
    const newTime = obj.timeSpent + addTime;
    apiUpdateOperation(obj.id, {
        description: description,
        timeSpent: newTime
    }).then(response => {
        if (!response.ok) {
            //console.log(response);
            throw new Error('Network response was not ok' + 'this is response: ' + response.json());
        } else {
            obj.updateTimeSpent(newTime);
            //console.log('updating operation: ', obj.id, 'was successful')
        }
    }).catch(error => console.log(error));

}

function deleteOperationHandler(evt, obj) {
    evt.preventDefault();
    apiDeleteOperation(obj.id).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.json());
        }
        obj.item.remove();
        obj = null;
    }).catch(error => console.log(error));

}

function finnishTaskHandler(evt, obj) {
    evt.preventDefault();
    const changedData = obj.taskData;
    changedData.status = 'closed';
    apiUpdateTask(obj.id, changedData).then(response => {
        if (!response.ok) {
            console.log(response)
            throw new Error('Network response was not ok' + response.json());
        }
        console.log(response);
        obj.closeTask();
        console.log('updating task: ', obj.taskData.id, 'was successful');
    }).catch(error => console.log(error));
}


/* section of classes representing DOM elements (rendered task and operation items)  */

class Component {
    createDiv(className, ...appendElements) {
        const div = document.createElement('div');
        div.className = className;
        if (appendElements.length > 0) {
            appendElements.forEach(element => div.append(element));
        }
        return div;
    }

    createButton(className, textContent) {
        const btn = document.createElement('button');
        btn.className = className;
        btn.textContent = textContent;
        return btn;
    }
}

class TaskCard extends Component {
    constructor(task) {
        super();
        if (typeof task !== "object") throw Error('Task must be an object');
        this.id = task.id;
        this.taskData = this.extractTaskData(task);
        this.operations = [];
        this.createCard();
    }

    /**
     *
     * @param task
     * @returns {{title: (string), description: (string), status: (string)}}
     */
    extractTaskData(task) {
        return {
            title: task.title,
            description: task.description,
            status: task.status
        }
    }

    createCard() {
        this.section = document.createElement('section');
        this.section.className = 'card mt-5 shadow-sm';
        this.createHeader();
        this.createButtons();
        this.list = this.createList();
        this.body = this.createBody();
        this.header.append(this.buttons)
        this.section.append(this.header);
        this.section.append(this.list);
        //console.log(task)
        if (this.body !== null) {
            //console.log(this.body)
            this.section.append(this.body);
        }
        //console.log(this.section.children)
    }

    render() {
        return this.section;
    }

    createHeader() {
        this.title = document.createElement('h5');
        this.description = document.createElement('h6');
        this.description.className = 'card-subtitle text-muted';
        this.title.textContent = this.taskData.title;
        this.description.innerText = this.taskData.description;
        this.headerText = this.createDiv('', this.title, this.description);
        this.header = this.createDiv('card-header d-flex justify-content-between align-items-center', this.headerText);
    }

    createButtons() {
        this.buttons = document.createElement('div');
        this.btnDelete = this.createButton('btn btn-outline-danger btn-sm ml-2', 'Delete');
        this.btnDelete.addEventListener('click', (e) => deleteTaskHandler(e, this))
        this.buttons.append(this.btnDelete);
        if (this.taskData.status === 'open') {
            this.btnFinish = this.createButton('btn btn-dark btn-sm', 'Finish');
            this.btnFinish.addEventListener('click', (e) => finnishTaskHandler(e, this))
            this.buttons.append(this.btnFinish);
        }
    }

    createList() {
        const ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush';
        return ul;
    }

    createBody() {
        if (this.taskData.status === 'closed') return null;
        const body = document.createElement('div');
        body.className = 'card-body';
        this.form = document.createElement('form');
        this.textInput = document.createElement('input');
        this.textInput.className = 'form-control';
        this.textInput.type = 'text';
        this.textInput.placeholder = 'Operation description';
        this.createAddBtn();
        this.inputBtnDiv = this.createDiv('input-group-append', this.addBtn)
        this.inputDiv = this.createDiv('input-group', this.textInput, this.inputBtnDiv);
        this.form.append(this.inputDiv);
        body.append(this.form);
        return body;
    }

    createAddBtn() {
        this.addBtn = this.createButton('btn btn-info', 'add');
        this.addBtn.addEventListener('click', (e) => addOperationHandler(e, this))
        //proc submit not work with button must be probably on form
    }

    closeTask() {
        this.taskData.status = 'closed';
        console.log(this.operations)
        this.operations.forEach(operation => {
            operation.buttons.remove();
        });
        this.body.remove();
        this.btnFinish.remove();
    }


}

class OperationItem extends Component {
    constructor(operation) {
        // console.log(operation.task.status)
        super();
        this.id = operation.id;
        this.description = operation.description;
        this.timeSpent = operation.timeSpent;
        this.timeBadge = this.createTimeBadge('badge badge-success badge-pill ml-2', this.timeSpent);
        this.createDescriptionDiv(this.timeBadge);
        this.item = this.createListItem();
        this.item.append(this.descriptionDiv);
        if (operation.task.status === 'open') {
            this.buttons = this.createButtons();
            this.item.append(this.buttons);
        }
    }

    static formatTime(timeInt) {
        return timeInt >= 60 ? `${Math.floor(timeInt / 60)}h ${timeInt % 60}min` : `${timeInt}min`;
    }

    createListItem() {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        return li;
    }

    createDescriptionDiv(element) {
        this.descriptionDiv = document.createElement('div');
        this.descriptionDiv.innerText = this.description;
        this.descriptionDiv.append(element);
        //console.log(this.descriptionDiv.children)
    }

    createButtons() {
        this.btnQuarter = this.createButton(' btn btn-outline-success btn-sm mr-2', '+15min');
        this.btnHour = this.createButton(' btn btn-outline-success btn-sm mr-2', '+1h');
        this.btnDelete = this.createButton('btn btn-outline-danger btn-sm', 'Delete');

        this.btnHour.addEventListener('click', (e) => updateOperationHandler(e, this, 60));
        this.btnQuarter.addEventListener('click', (e) => updateOperationHandler(e, this, 15));
        this.btnDelete.addEventListener('click', (e) => deleteOperationHandler(e, this));
        return this.createDiv('', this.btnQuarter, this.btnHour, this.btnDelete);
    }

    createTimeBadge(className, textContent) {
        const badge = document.createElement('span');
        badge.className = className;
        badge.textContent = OperationItem.formatTime(textContent);
        return badge;
    }

    updateTimeBadge() {
        this.timeBadge.textContent = OperationItem.formatTime(this.timeSpent);
    }

    updateTimeSpent(newTime) {
        this.timeSpent = newTime;
        this.updateTimeBadge();
    }

    render() {
        return this.item;
    }

}



/**
 * Formats a date given the month, day, and year into MM/DD/YYYY format
 * 
 * @param {number} month - The month to format
 * @param {number} day - The day of the month
 * @param {number} year - The year
 * @returns {string} The formatted date string in MM/DD/YYYY format
 */
export function formatDate(month, day, year){
	month = JSON.stringify(month);
	year = JSON.stringify(year);
	day = JSON.stringify(day);
	let formatMonth = month < 10 ? 0 + month : month;
	let formatDay = day < 10 ? 0 + day : day;
	let formatDate = formatMonth + '/' + formatDay+ '/' + year;
	return formatDate;
}

/**
 * Removes all task elements from the calendar and resets the background color
 * of all day elements.
 */
export function clearTasks(){
	let allTasks = document.querySelectorAll(".task"); 
	let allDayElems = document.getElementById("allday-tasks").querySelectorAll("th");
	for(let i = 1; i < allDayElems.length; i++){
		let pars = allDayElems[i].querySelectorAll("div");
		for(let j = 0; j < pars.length; j++){
			pars[j].innerHTML = "";
			pars[j].style.backgroundColor = "lightgray";
		}
	}
	if(!allTasks){
		return;
	}
	let numTasks = allTasks.length;
	for(let i = 0; i < numTasks; i++){
		allTasks[i].remove();
	}
}

/**
 * This function gets the task list from localStorage and parses it into a map.
 * If no task list is found, it returns an empty map.
 * 
 * @returns {Object} The task map
 */
export function getTaskMap(){
	let tMap = {};
	let tasklist = localStorage.getItem('tasklist');
	if(tasklist == null){
		return tMap; //empty tMap
	}
	tMap = JSON.parse(tasklist);
	return tMap;
}

/**
 *  Function to get the tasks for a given week in the form of an array with seven elements,
 * each element containing an array with tasks for the corresponding day of the week
 * @param {Array} datesArr 
 * @returns {Array} -2D array where each element is an array of tasks for that day of the week
 */
function getWeekTasks(datesArr){
	let tasksArr = [];
	let tMap = getTaskMap();
	for(let i = 0; i < 7; i++){
		tasksArr.push(tMap[datesArr[i]['date']]);
	}
	return tasksArr;
}

/**
 * Function to round a given time (in the format "00:00") to the nearest 30 minutes
 * @param {string} timeUnrounded 
 * @returns {Array} array of integers in the form [hours, min] that coordinate to the parameters rounded hours and mins
 */
function roundTimeBy30(timeUnrounded){
	let [hr, min] = timeUnrounded.split(":").map(part => parseInt(part, 10));
	if( min < 15){
		min = 0;
	} else if( min <= 30){
		min = 30;
	} else if(min < 45){
		min = 30
	} else{
		min = 0;
		hr += 1;
	}
	return [hr, min];
}

/**
 * Function to format the tasks for each day in a format containing
 * containg the task, rounded start time, rounded end time
 * @param {Array} tasksForDay 
 * @returns {Array} array of tasks for a day where each element is an object with the given task, rounded start time, rounded end time
 */
function roundedFormat(tasksForDay){
	let roundedFormat = [];
	if(!tasksForDay){
		return;
	}
	for(let i = 0; i < tasksForDay.length; i++){
		let singleTask = tasksForDay[i];
		const timeStart = singleTask['startTime'];
		let newStart = roundTimeBy30(timeStart);
		const timeEnd = singleTask['endTime'];
		let newEnd = roundTimeBy30(timeEnd);
		let taskInfoObj = {
			task: tasksForDay[i],
			roundStart: newStart,
			roundEnd: newEnd
		}
		roundedFormat.push(taskInfoObj);

	}
	return roundedFormat;
}

/**
 * Function to get the number of rows a given task that will be displayed
 * @param {Object} singularTask 
 * @returns {Number} number of rows that task will take up in the display grid
 */
function mathRowLength(singularTask){
	const startHr = singularTask['roundStart'][0];
	const startMin = singularTask['roundStart'][1];
	const endHr = singularTask['roundEnd'][0];
	const endMin = singularTask['roundEnd'][1];
	const result = 2 * (endHr - startHr) + (Math.abs(startMin - endMin) / 30);//calculate number of rows
	return result; 
}

/**
 * Function to compare if a given tasks is after another task (or has an later start time) 
 * which is used to populate calendar in backwards chronological order for overlapping
 * @param {Object} task1 
 * @param {Object} task2 
 * @returns {Number} -1 if task1 is after task2, 1 if task2 is after task1, 0 if they have same start time
 */
function compareIsAfter(task1, task2){
	const hour1 = task1['roundStart'][0];
	const minute1 = task1['roundStart'][1];
	const hour2 = task2['roundStart'][0];
	const minute2 = task2['roundStart'][1];
	if (hour1 < hour2 || (hour1 === hour2 && minute1 < minute2)) {
		return -1; //task 1 is after
	} else if (hour1 > hour2 || (hour1 === hour2 && minute1 > minute2)) {
		return 1; //task 2 is after
	} else {
		return 0; //they have same start time
	}
}


/**
 * Function to sort the tasks array by latest start time
 * @param {Array} tasksForDay 
 * @returns {Array} tasks for a given day sorted by latest start times
 */
export function sortTasks(tasksForDay){ 
	if(!tasksForDay){
		return;
	}
	for(let i = 1; i < tasksForDay.length; i++){
		let curr = tasksForDay[i];
		let j = i -1;
		while(j >= 0 && compareIsAfter(tasksForDay[j], curr) > 0){
			tasksForDay[j + 1] = tasksForDay[j];
			j--;
		}
		tasksForDay[j+1] = curr;
	}
	return tasksForDay;
}

/**
 * Function to display tasks for a given week on the grid
 * @param {Array} datesArr 
 * @returns returns when all tasks are finished being displayed
 */
export async function addNewTasks(datesArr){
	let tasksForWeek = getWeekTasks(datesArr);
	if(!tasksForWeek){
		return;
	}
	for(let i = 0; i < tasksForWeek.length; i++){
		let tasksForDay = tasksForWeek[i];
		if(!tasksForDay){
			continue;
		}
		tasksForDay = roundedFormat(tasksForDay);
		tasksForDay = sortTasks(tasksForDay);
		for(let j = 0; j < tasksForDay.length; j++){
			let taskLen = mathRowLength(tasksForDay[j]);
			let hr = tasksForDay[j]['roundStart'][0] < 10 ? "0" + JSON.stringify(tasksForDay[j]['roundStart'][0]) : JSON.stringify(tasksForDay[j]['roundStart'][0]);
			let min = tasksForDay[j]['roundStart'][1] === 0 ? "00" : "30";
			let rowId = "r" + hr + min;
			displayTaskCalendar(rowId, i + 1, tasksForDay[j]['task'], taskLen);
		}

	}
}

/**
 * Update position and dimension of a task element based on its corresponding cell
 * @param {HTMLElement} newElem - The task element to update
 * @param {HTMLElement} cell - The grid cell element where the task is located
 * @param {number} len - The length of the task in terms of grid cells
 */
function updateTaskPos(newElem, cell, len){
	const rect = cell.getBoundingClientRect();
    newElem.style.top = `${rect.top}px`;
    newElem.style.left = `${rect.left}px`; 
	newElem.style.width = `${rect.width}px`;
	newElem.style.height = `${rect.height * len}px`;
}

/**
 * Function to get task background color
 * @param {string} priority 
 * @returns {string} correct color of task based on priority
 */
function getTaskColor(priority){
	if(priority == "low"){
		return "green";
	} else if(priority == "medium"){
		return "orange";
	} else{
		return "red";
	}
}

/**
 * Displays an all-day task in the all-day task area
 * 
 * @param {number} col - The column index where the task should be displayed
 * @param {Object} task - The task object containing task details
 */
function displayAllDayTask(col, task){
	let allDayElems = document.getElementById("allday-tasks").querySelectorAll("th");
		let newAllDay = document.createElement("div");
		if(!newAllDay){
			console.log("failed to create div element for all day task");
			return;
		}
		newAllDay.innerHTML = task['title'];
		newAllDay.style.backgroundColor = getTaskColor(task['priority']);
		newAllDay.style.color = "white";
		allDayElems[col].append(newAllDay);
		return;
}

/**
 * Creates a new task element to be displayed on the grid
 * @param {HTMLElement} rCont - The container element where the task will be added
 * @returns {HTMLElement} The newly created task element
 */
function createTaskElement(rCont, task){
  let newElem = document.createElement("div");
	if(!newElem){
		console.log("creating new div for task to be displayed failed")
		return;
	}
  newElem.className = "task";
  newElem.style.position = "absolute";
  newElem.textContent = task['title']; 
  newElem.style.backgroundColor = getTaskColor(task['priority']);
  rCont.appendChild(newElem);
  return newElem;
}

/**
 * Waits until element (found by selector) is created then returns
 * @param {string} selector - name of selector being returned
 */
function waitForElement(selector) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
        } else {
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
          
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
}

/**
 * Adjusts tasks placement and size based on scrolling and window resizing 
 * @param {element} rCont 
 * @param {element} newElem 
 * @param {element} cell 
 * @param {number} len 
 */
async function adjustTasksResizing(rCont, newElem, cell, len){

    // Update the position on (right container) scroll
    rCont.addEventListener("scroll", () => {
		updateTaskPos(newElem, cell, len);
    });
	 // Update the position on main section scroll
	 document.querySelector("main").addEventListener("scroll", () => {
		updateTaskPos(newElem, cell, len);
    });
	 // Update the position on main section scroll
	 window.addEventListener("scroll", () => {
		updateTaskPos(newElem, cell, len);
    });	
	//Update the position on page resizing
	window.addEventListener("resize", () => {
		updateTaskPos(newElem, cell, len);
    });
	let minBar, sR;

	await waitForElement('.minimized')
    .then(element => {
        minBar = element;
        sR = minBar.shadowRoot;
    })
    .catch(error => {
        console.error('Error:', error);
    });
	let minButton = sR.getElementById('minimize-btn');
	//Update the position when side bar is minimized
	minButton.addEventListener("click", () => {
		updateTaskPos(newElem, cell, len);
	});
}

/**
 * Function to display a singular task to its correct location on the grid
 * @param {string} rowId 
 * @param {number} col 
 * @param {Object} task 
 * @param {number} len 
 */
export function displayTaskCalendar(rowId, col, task,len) {
	if(len == 0){
		len == 1; //if a task was less than 15 minutes long, make it still be displayed in 1 cell;
	}
	if(len == 48){ //all day task
		displayAllDayTask(col, task);
		return;
	}
  const rCont = document.querySelector(".right-container");
  let newElem = createTaskElement(rCont, task);
  cell = document.getElementById(rowId).querySelectorAll('td')[col];

  updateTaskPos(newElem, cell, len);
  adjustTasksResizing(rCont, newElem, cell, len);
}

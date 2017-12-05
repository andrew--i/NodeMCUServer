const repository = require('../repository/repository');


function schedule() {
    setInterval(checkSchedule, 1000 * 60 * 60)
}

let prevDate = undefined;

function checkSchedule() {
    if (!prevDate)
        prevDate = new Date();
    else {
        if (new Date().getDay() !== prevDate.getDay()) {
            prevDate = new Date();
            executeTask();
        }
    }
}


function executeTask() {
    repository.getDHTForDay();
}


module.exports = {
    schedule: schedule
};
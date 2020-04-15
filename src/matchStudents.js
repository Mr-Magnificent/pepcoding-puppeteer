const Table = require('cli-table');
const chalk = require('chalk');

/**
 * This function takes an Array of students submission per question and find the missing students
 * within the by comparing it with studentsEnrolled in fileContent
 * @param {import('./getStatsFromPage').Student[][]} allQuestionSubmission student submission per question
 * @param {Object} fileContent File contents of --file-path
 * @returns {Promise.<undefined>}
 */
async function matchStudents(allQuestionSubmission, fileContent) {
    const enrolledStudentsMap = new Map();

    fileContent['studentsEnrolled'].forEach((student) => {
        enrolledStudentsMap.set(student.id, student);
    });

    let stats = [];
    for (let questionSubmissions of allQuestionSubmission) {
        let studentsPartialSubmissionSet = new Set();
        let enrolledStudentsTempMap = new Map(enrolledStudentsMap);

        // * populate the partialSubmission and remove those who have submitted completely
        for (let submission of questionSubmissions) {
            if (submission.score < 10) {
                studentsPartialSubmissionSet.add(submission.id);
                enrolledStudentsTempMap.delete(submission.id);
            } else if (submission.score === 10) {
                enrolledStudentsTempMap.delete(submission.id);
            }
        }

        // * What is remaining in enrolledStudentsTemp are those who haven't submitted
        let noSubmissionsSet = new Set();
        for(let student of enrolledStudentsTempMap.keys()) {
            noSubmissionsSet.add(student);
        }

        stats.push({ partial: studentsPartialSubmissionSet, none: noSubmissionsSet });
    }

    // console.log(stats);
    displayTableToCLI(fileContent, stats);
}

/**
 * 
 * @param {Object} fileContent content of .pepconfig.json
 * @param {stats} stats stats of the students
 */
function displayTableToCLI(fileContent, stats) {
    let quesIdx = fileContent.questionsUrl.map((val, idx) => idx);
    quesIdx = ['name', ...quesIdx];
    const table = new Table({
        colors: true,
        head: quesIdx
    });

    /**
     * @type {import('./getStatsFromPage').Student[]}
     */
    const studentsToDisplay = fileContent['studentToCheck'];
    for(let student of studentsToDisplay) {
        let studentStats = [];
        studentStats.push(student.name);
        for(let questionStat of stats) {
            if (questionStat['partial'].has(student.id)) {
                studentStats.push(chalk.yellow('pa'));
            } else if (questionStat['none'].has(student.id)) {
                studentStats.push(chalk.red('no'));
            } else {
                studentStats.push(chalk.green('ok'));
            }
        }
        table.push(studentStats);
    }

    console.clear();
    console.log(table.toString());
}

module.exports = matchStudents;

/**
 * @typedef stat
 * @property {Set} partial
 * @property {Set} none
 */

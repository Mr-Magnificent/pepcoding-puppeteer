const arg = require('arg');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const inquirer = require('inquirer');
const path = require('path');
const fuzzy = require('fuzzy');

const loadStudents = require('./loadStudentList');
const { getStatsFromPage } = require('./getStatsFromPage')

const pipeline = util.promisify(stream.pipeline);

function parseArgumentsIntoOptions(rawArgs) {

    const args = arg(
        {
            '--help': Boolean,
            '--install': Boolean,
            '--yes': Boolean,
            '--questions': [String],
            '--create-config': Boolean,
            '--file-path': String,
            '--course': [String],

            // * Aliases
            '-q': '--questions',
            '-y': '--yes',
            '-i': '--install',
            '-C': '--create-config',
            '-c': '--course',
            '-h': '--help',
            '-f': '--file-path',
        },
        {
            argv: rawArgs.slice(2),
            permissive: true
        }
    );

    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || false,
        runInstall: args['--install'] || false,
        questions: args['--questions'] || [],
        filePath: args['--file-path'] || '../.pepconfig.json',
    };
}

async function promptForMissingOptions(options) {
    const questions = [];
    try {
        let fileContent = JSON.parse(await fs.promises.readFile(path.resolve(options.filePath)));
        await updatePepConfig(fileContent, options.filePath);
        fileContent = JSON.parse(await fs.promises.readFile(path.resolve(options.filePath)));
        await getStatsFromPage(fileContent.questions);

    } catch (err) {
        if (err.code === 'ENOENT') {
            try {
                await createNewFile(options.filePath);
            } catch (err) {
                console.error(err.stack);
            }
        }
        console.log(err);
    }
}

/**
 * Updates the contents of .pepconfig.json if required incase there is new
 * admissions and fetches the stats for them. 
 * (Student must have submitted at least 1 question for them to be considered enrolled)
 * @param {Object} fileContent The contents of /.*\/.pepconfig.json
 * @param {String} path The path where /.*\/.pepconfig.json is stored
 */
async function updatePepConfig(fileContent, path) {
    try {
        const { updateNeeded } = await inquirer.prompt({
            type: 'confirm',
            name: 'updateNeeded',
            message: 'Do you want to update pepconfig file',
            default: true,
        });

        if (updateNeeded === false) return;

        const { email } = await inquirer.prompt({
            type: 'input',
            name: 'email',
            message: 'Update email address?',
            default: true,
            default: fileContent.email
        });

        fileContent['email'] = email;

        let studentsEnrolled = [];

        for (let url of fileContent.courseUrls) {
            const students = await loadStudents.fetchStudentList(url);
            studentsEnrolled = [...studentsEnrolled, ...students];
        }

        const { selectStudents } = await inquirer.prompt({
            type: 'confirm',
            name: 'selectStudents',
            message: 'Do you want to select specific students from enrolled students',
            default: true,
        });

        let studentsSelected;
        // fetch students to select
        if (selectStudents === true)
            studentsSelected = await fetchSelectedStudents(studentsEnrolled);

        fileContent['studentsEnrolled'] = studentsEnrolled;
        fileContent['studentToCheck'] = studentsSelected || studentsEnrolled;

        await fs.promises.writeFile(path, JSON.stringify(fileContent));
    } catch (err) {
        console.log(err.stack);
        throw err;
    }
}

async function createNewFile(filePath) {
    const courseDetails = {};
    let questions = [];

    questions.push({
        type: 'confirm',
        name: 'createNewFile',
        message: 'Do you wish to create new file',
        default: true,
    });

    const { createNewFile } = await inquirer.prompt(questions);

    if (createNewFile === true) {
        questions = [];

        // ask for email
        questions.push({
            type: 'input',
            name: 'email',
            message: 'Enter your email:',
            validate: (input) => {
                if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input) == false) {
                    return "Please enter a valid email"
                }

                return true;
            }
        });

        questions.push({
            type: 'input',
            name: 'course',
            message: 'Enter the link to the course homepage:',
            validate: (input) => {
                if (/https:\/\/www.pepcoding.com\/resources\/.+/.test(input) == false) {
                    return "url should be of form 'https://www.pepcoding.com/resources/.*'";
                }

                return true;
            }
        });

        questions.push({
            type: 'confirm',
            name: 'loadStudents',
            message: 'Would you like to get the list of students:',
            default: true,
        });

        const answers = await inquirer.prompt(questions);

        process.env.PEP_MAIL = answers.email;

        let studentsEnrolled = [];
        if (answers.loadStudents === true) {
            studentsEnrolled = await loadStudents.fetchStudentList(answers.course);
        }

        let selectedStudents = [];
        const { selectAllStudents } = await inquirer.prompt({
            type: 'confirm',
            name: 'selectAllStudents',
            message: 'Select all students to show results for?',
            default: true
        });

        if (selectAllStudents === true) {
            selectedStudents = studentsEnrolled;
        } else {
            selectedStudents = await fetchSelectedStudents(studentsEnrolled);
        }
    }
}

/**
 * This function receives the students that are returned by loadStudents function 
 * and prompts the user to choose the students for which to show the stats for
 * @param {Object[]} studentsEnrolled Array of students enrolled within a course
 * @returns {Object[]} Array of students to show stats for
 */
async function fetchSelectedStudents(studentsEnrolled) {
    const studentMappedObj = studentsEnrolled.map((student) => {
        const obj = {};
        obj.name = student.name;
        obj.value = student;
        obj.short = student.name;
        return obj;
    });

    inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
    const selectionResult = await inquirer.prompt({
        type: 'checkbox-plus',
        name: 'studentsSelected',
        message: 'Select the students to show results for',
        pageSize: 10,
        highlight: true,
        searchable: true,
        source: function (_, input) {
            input = input || '';
            return new Promise((resolve) => {
                const fuzzyResult = fuzzy.filter(input, studentMappedObj, {
                    extract: (student) => student['name']
                });
                const data = fuzzyResult.map((ele) => {
                    return ele.original;
                });
                resolve(data);
            });
        }
    });
    return selectionResult.studentsSelected;
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    await promptForMissingOptions(options);
}

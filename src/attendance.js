const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const json2xls = require('json2xls');

const { getStatsFromPage } = require('./getStatsFromPage');

async function attendance(options) {
    try {
        const fileContent = JSON.parse(await fs.promises.readFile(path.resolve(options.filePath)));

        const inqAns = await inquirer.prompt({
            type: 'password',
            mask: '*',
            name: 'password',
            message: 'Please enter your pep password:',
        });

        process.env.PEP_MAIL = fileContent.email;
        process.env.PEP_PASS = inqAns.password;

        const consoleStatus = ora(chalk.bold('Logging In'));
        consoleStatus.indent = 4;
        consoleStatus.start()

        const page = await login();

        consoleStatus.succeed(chalk.bold('logged In'));
        consoleStatus.start(chalk.bold('Navigating to Course page'));

        await page.goto(options['attendanceUrl'], {
            waitUntil: 'networkidle0'
        });

        consoleStatus.succeed(chalk.bold('Navigated to Course page'));

        consoleStatus.start(chalk.bold('fetching Student list'));
        let students = await getStatsFromPage(page);
        await consoleStatus.succeed();

        await page.close();
        await markAttendance(fileContent, students);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('pepconfig file not provided, please provide pepconfig file.');
        } else {
            console.log(err.stack);
        }
    }
}

/**
 * @returns {import('puppeteer').Page}
 */
async function login() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const pages = await browser.pages();

    const page = pages[0];

    await page.goto('https://www.pepcoding.com/login', {
        waitUntil: 'networkidle2'
    });

    // * logging into pepcoding using the email and password
    await page.waitForSelector('input[name=email]');
    await page.$eval('input[name=email]', (el, email) => (el.value = email), process.env.PEP_MAIL);
    await page.waitForSelector('input[name=password]');
    await page.$eval('input[name=password]', (el, pass) => (el.value = pass), process.env.PEP_PASS);

    await page.click('button[type=submit]');

    return page;
}

attendance({
    filePath: '../.pepconfig.json',
    attendanceUrl: process.argv[2] 
})

async function markAttendance(fileContent, students) {
    const studentMap = new Map();

    for (let student of students) {
        studentMap.set(student.id, student);
    }

    console.log(studentMap);
    const attendance = [];

    for (let enrolled of fileContent['studentToCheck']) {
        console.log(enrolled);
        if (studentMap.has(enrolled.id)) {
            attendance.push({
                name: enrolled.name,
                attendance: 'present'
            });
        } else {
            attendance.push({
                name: enrolled.name,
                attendance: 'absent'
            });
        }
    }

    const xlsData = json2xls(attendance);

    const inqAns = await inquirer.prompt({
        type: 'input',
        name: 'suffix',
        message: 'Enter the course name:',
    });

    const date = new Date().toLocaleDateString('en-IN',{ year: 'numeric', month: 'long', day: 'numeric' });
    console.log(date);
    const savePath = '.';
    try {
        await fs.promises.writeFile(savePath + `/${date}-${inqAns.suffix}.xlsx`, xlsData, 'binary');
    } catch (err) {
        console.log(err.stack);
        console.log('wow');
    }
}

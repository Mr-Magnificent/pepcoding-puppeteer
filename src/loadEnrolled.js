const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');

const { getStatsFromPage } = require('./getStatsFromPage');

require('dotenv').config({
    path: __dirname + '/../.env'
});

/**
 * Fetches the enrolled students within the course passed as the url
 * @param {String} url The URL of the course from where to fetch the student details
 * @returns {import('./getStatsFromPage').Student[]}  Student list for that particular course
 */
async function fetchStudentList(url) {
    try {
        const inqAns = await inquirer.prompt({
            type: 'password',
            mask: '*',
            name: 'password',
            message: 'Please enter your pep password:',
        });


        const consoleStatus = ora(chalk.bold('Logging In'));

        consoleStatus.indent = 4;

        consoleStatus.start()

        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 10,
            defaultViewport: null
        });

        process.env.PEP_PASS = inqAns.password;
        process.env.PEP_MAIL = 'ayush.zombiestar@gmail.com';

        const pages = await browser.pages();

        const page = pages[0];

        await page.goto(process.env.LOGIN_URL, {
            waitUntil: 'networkidle0'
        });

        // * logging into pepcoding using the email and password
        await page.waitForSelector('input[name=email]');
        await page.$eval('input[name=email]', (el, email) => (el.value = email), process.env.PEP_MAIL);
        await page.waitForSelector('input[name=password]');
        await page.$eval('input[name=password]', (el, pass) => (el.value = pass), process.env.PEP_PASS);

        await page.click('button[type=submit]');

        consoleStatus.succeed(chalk.bold('logged In'));

        consoleStatus.start(chalk.bold('Navigating to Course page'));

        await page.goto(url, {
            waitUntil: 'networkidle0'
        });

        consoleStatus.succeed(chalk.bold('Navigated to Course page'));

        // * switching to the stats page that contains the overall stats of course
        consoleStatus.start(chalk.bold('fetching Student list'));
        let students = await getStatsFromPage(page);
        await consoleStatus.succeed();
        
        await browser.close();
        return students;
    } catch (err) {
        console.log(err.stack);
        throw err;
    }
}

exports.fetchStudentList = fetchStudentList;
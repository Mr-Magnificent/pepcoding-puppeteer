const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');

require('dotenv').config({
    path: __dirname + '/../.env'
});

const { getStatsFromPage } = require('./getStatsFromPage');

async function getQuestionDetails(questionUrls) {
    try {
        if (process.env.PEP_PASS === undefined) {
            const inqAns = await inquirer.prompt({
                type: 'password',
                mask: '*',
                name: 'password',
                message: 'Please enter your pep password:',
            });
            process.env.PEP_PASS = inqAns.password;
        }

        const consoleStatus = ora(chalk.bold('Logging In'));

        consoleStatus.indent = 4;

        const browser = await puppeteer.launch({
            defaultViewport: null
        });

        const overallPages = await browser.pages();

        const loginPage = overallPages[0];

        await loginPage.goto(process.env.LOGIN_URL, {
            waitUntil: 'networkidle0'
        });

        process.env.PEP_MAIL = 'ayush.zombiestar@gmail.com';

        await loginPage.waitForSelector('input[name=email]');
        await loginPage.$eval('input[name=email]', (el, email) => (el.value = email), process.env.PEP_MAIL);
        await loginPage.waitForSelector('input[name=password]');
        await loginPage.$eval('input[name=password]', (el, pass) => (el.value = pass), process.env.PEP_PASS);

        await loginPage.click('button[type=submit]');

        const pages = [];

        for (let questionUrl of questionUrls) {
            const page = await browser.newPage();
            pages.push(getQuestionStatsPromise(page));
        }

        const submissionsPerQuestions = await Promise.all(pages);

        console.log(submissionsPerQuestions);

    } catch (err) {
        console.log(err.stack);
        throw err;
    }
}

getQuestionDetails([
    "https://www.pepcoding.com/resources/online-java-foundation/patterns/pattern-type-3-official/ojquestion",
    "https://www.pepcoding.com/resources/online-java-foundation/arrays-2-d-arrays/spiral-display-official/ojquestion"
]);

/**
 * 
 * @param {Page} page 
 */
function getQuestionStatsPromise(page) {
    return new Promise (async (resolve, reject) => {
        try {
            const students = await getStatsFromPage(page);
            resolve(students);
        } catch (err) {
            reject(err);
        }
    });
}
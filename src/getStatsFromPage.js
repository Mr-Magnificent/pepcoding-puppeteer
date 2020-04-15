/**
 * Student type that represents each individual student on portal
 * @typedef {Object} Student
 * @property {String} id unique id to identify the student
 * @property {String} name name of the student
 * @property {Number} score score of the student
 * @property {Number} avg Average score of the student
 */

/**
 * A generic function that gets all the student stats from the {WebElement} Page passed as reference
 * @summary Can be called after login within browser
 * @param {import('puppeteer').Page} page The browser page object on which we can get the details of
 *  particular question
 * @returns {Student[]} Array of student details
 */
async function getStatsFromPage(page) {
    await page.waitForSelector('#siteLoader', {
        hidden: true
    });


    await page.waitForSelector('a[action=showStats]');
    await page.click('a[action=showStats]');

    await page.waitForResponse((res) => {
        return /https:\/\/www.pepcoding.com\/stats\/.*/.test(res.url());
    }, {
        timeout: 10000
    });

    // * fetch all the students names and details
    await page.waitForSelector('select#showStatsPerpage');
    await page.select('select#showStatsPerpage', '100');

    await page.waitForResponse((res) => {
        return /https:\/\/www.pepcoding.com\/stats\/.*/.test(res.url());
    }, {
        timeout: 10000
    });

    let getPages;
    let idx = 1;

    // * iterate over all the valid pages from 1 to n
    let students = [];
    await page.waitForSelector('ul.pagination > li', {
        visible: true
    });

    await page.waitForSelector('#siteLoader', {
        hidden: true
    });

    do {
        getPages = await page.$$('ul.pagination > li');
        await getPages[idx].click();
        await page.waitForSelector('li.collection-item.row.no-padding', {
            visible: true
        });

        const studentsOnCurrentPage = await page.$$('li.collection-item.row.no-padding');
        let studentObjects = await getStudentsInEachPage(studentsOnCurrentPage, page);
        students = [...students, ...studentObjects];
        idx += 1;
    } while (idx < getPages.length - 1);
    return students;
}

/**
 * Gets the student details of students that are present on current page 
 * of pagination of the stats page. The DOM nodes need to be passed to
 * get the details of the student
 * @param {import('puppeteer').ElementHandle[]} studentsElements Student DOM nodes on current page
 * @returns {Student[]} student objects containing the details of student
 */
async function getStudentsInEachPage(studentsElements, page) {
    let students = [];

    for (let studentDetail of studentsElements) {
        const student = {};
        student.id = await page.evaluate((ele) => ele.id, studentDetail);

        const detailDOM = await studentDetail.$$('span');
        student.name = await page.evaluate((el) => el.innerText, detailDOM[1]);
        student.score = await page.evaluate((el) => parseInt(el.innerText), detailDOM[2]);
        student.avg = await page.evaluate((el) => parseFloat(el.innerText), detailDOM[3]);

        students.push(student);
    }

    return students;
}

exports.getStatsFromPage = getStatsFromPage;
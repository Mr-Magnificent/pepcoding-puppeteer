/**
 * This function
 * @param {Page} page The browser page object on which we can get the details of particular question
 */
async function getStatsFromPage(page) {

    await page.waitForSelector('a[action=showStats]');
    await page.click('a[action=showStats]');

    // * fetch all the students names and details
    await page.waitForSelector('select#showStatsPerpage');
    await page.select('select#showStatsPerpage', '100');

    await page.waitForResponse((res) => {
        return /https:\/\/www.pepcoding.com\/stats\/courseId/.test(res.url());
    }, {
        timeout: 10000
    });

    let getPages;
    let idx = 1;

    // * iterate over all the valid pages from 1 to n
    let students = [];
    await page.waitForSelector('ul.pagination > li');

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
 * @param {Object[]} studentsDOMNodes Student DOM nodes on current page
 * @returns {Object[]} student objects containing the details of student
 */
async function getStudentsInEachPage(studentsDOMNodes, page) {
    let students = [];

    for (let studentDetail of studentsDOMNodes) {
        const student = {};
        student.id = await page.evaluate((ele) => ele.id, studentDetail);

        const detailDOM = await studentDetail.$$('span');
        student.name = await page.evaluate((el) => el.innerText, detailDOM[1]);
        student.score = await page.evaluate((el) => el.innerText, detailDOM[2]);
        student.avg = await page.evaluate((el) => el.innerText, detailDOM[3]);

        students.push(student);
    }

    return students;
}

exports.getStatsFromPage = getStatsFromPage;
# pepcoding-puppeteer

## A CLI-tool to maintain the submissions for the students.

* This project helps identify which students are currenly lagging behind in their submissions in normal classes so that they 
can be targetted by the TA's for support.

* This project helps instructors taking **backup classes** by allowing them to isolate the students which they are currently
teaching from all the submissions present for the question already, this would be helpful since **backup classes** don't have
TAs, Quickly identifying lagging students help to target the attention and increase pace of class.

* This project can be used show the history of the student through multiple questions by showing their gradual progress
through them.

* Can be used to show stats per module basis as well.

* Can be used in batches that combine students from multiple courses by assigning multiple courses. Common scenario would be
TA's having students from multiple batches but still need to see who all have submitted and who is lagging

* All the project features can be controlled using a **pepconfig.json** file which is made during the first start-up of the
CLI. A custom path for **pepconfig.json** can also be provided and any name other that **pepconfig.json** since most 
instructors manage multiple batches and a individual **pepconfig.json** can be maintained for each of them.

* The CLI also supports command line arguements incase of constructing a *.bat* / *.sh* file.

* Incase of no command line arguements passed the CLI asks relevant questions from the user to get the resources.

* Sorting of the students based on `not submission` or `partial submission` is also possible though not implimented yet.

* Can be used by anyone enrolled in the course, this includes TA's. So they can see and target themselves, reducing load on
Instructor. 

# Run #
```
$ git clone https://github.com/Mr-Magnificent/pepcoding-puppeteer.git
$ cd pepcoding-puppeteer
$ npm install
$ node index.js
```

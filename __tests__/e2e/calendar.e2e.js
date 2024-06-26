describe('e2e testing for calendar', () => {
    const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));
    beforeAll(async () => {
      await page.goto('http://localhost:3000/', {waitUntil: 'networkidle2'});
      const navbarHandles = await page.$$('my-navbar >>> .nav-row');
      await navbarHandles[1].click();
      await delay(1000);
    });

    afterAll(async () => {
        await page.evaluate(() => localStorage.clear());
    });

    it('Add new tasks and check they are displayed on calendar', async () => {
        console.log('Add tasks and check they are displayed on calendar');
        await page.evaluate(() => {
            let taskMap = JSON.parse(localStorage.getItem('tasklist'));
            if (!taskMap) {
            // if(!(JSON.parse(localStorage.getItem('tasklist')))) {
                localStorage.setItem('tasklist', JSON.stringify([]));
            }
            taskMap = JSON.parse(localStorage.getItem('tasklist'));
            const existingIds = new Set();
            Object.keys(taskMap).forEach(date => {
                taskMap[date].forEach(task => {
                existingIds.add(task.id);
                });
            });
            let inputId;
            do {
                inputId = Math.floor(Math.random() * 2000000);
            } while (existingIds.has(inputId));

            const currDate = new Date();
            let options = { year: "numeric", month: "2-digit", day: "2-digit" };
            const date = currDate.toLocaleDateString("en", options);
            console.log("Date: ", date);

            let taskObject = { id: inputId, title: "test", date: date, startTime: "10:00", endTime: "20:30", description: "test", labels: [], priority: 'low', allDay: 'off'};

            if (!taskMap[date]) {
                taskMap[date] = [];
            }
            // console.log("Task to add: ", taskObject);
            taskMap[date].push(taskObject);
            console.log("TaskMap: ", taskMap);
            localStorage.setItem('tasklist', JSON.stringify(taskMap));
        });
        await page.reload({ waitUntil: ['domcontentloaded', 'networkidle0'] });
        await page.waitForSelector('.task');
        const tasks = await page.$$('.task');
        console.log("Tasks arr: ", tasks);
        expect(tasks.length).toBe(1);
    });
});
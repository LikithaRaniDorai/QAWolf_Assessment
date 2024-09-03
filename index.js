const { chromium } = require('playwright');

(async () => {
  // Launch a browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Go to Hacker News 'newest' page
  await page.goto('https://news.ycombinator.com/newest');

  // Wait for the articles to load
  await page.waitForSelector('.athing');

  // Function to convert relative time to an absolute Date object
  const convertRelativeTimeToDate = (relativeTime) => {
    const now = new Date();
    let timeAgo = relativeTime.toLowerCase();

    if (timeAgo.includes('just now')) {
      return now;
    }

    const timeParts = timeAgo.split(' ');
    const value = parseInt(timeParts[0]);
    const unit = timeParts[1].startsWith('minute') ? 'minutes'
               : timeParts[1].startsWith('hour') ? 'hours'
               : timeParts[1].startsWith('day') ? 'days'
               : timeParts[1].startsWith('month') ? 'months'
               : timeParts[1].startsWith('year') ? 'years'
               : null;

    if (!unit) return now; // Fallback to now if the unit is unrecognized

    let date = new Date(now); // Clone the current date
    switch (unit) {
      case 'minutes':
        date.setMinutes(now.getMinutes() - value);
        break;
      case 'hours':
        date.setHours(now.getHours() - value);
        break;
      case 'days':
        date.setDate(now.getDate() - value);
        break;
      case 'months':
        date.setMonth(now.getMonth() - value);
        break;
      case 'years':
        date.setFullYear(now.getFullYear() - value);
        break;
    }

    return date;
  };

  // Select all the articles on the page
  const articles = await page.$$eval('.athing', articles => {
    return articles.map(article => {
      const titleElement = article.querySelector('.titleline a');
      const ageElement = article.querySelector('.subtext > span'); // Updated selector

      if (titleElement && ageElement) {
        const title = titleElement.innerText;
        const timeAgo = ageElement.innerText;
        return { title, timeAgo };
      } else {
        return null;
      }
    }).filter(article => article !== null); // Filter out any null values
  });

  // Convert the timeAgo strings to Date objects for comparison
  const articleDates = articles.map(article => convertRelativeTimeToDate(article.timeAgo));

  // Validate the first 100 articles are sorted from newest to oldest
  let isSorted = true;
  for (let i = 1; i < Math.min(articleDates.length, 100); i++) {
    if (articleDates[i] > articleDates[i - 1]) {
      isSorted = false;
      break;
    }
  }

  if (isSorted) {
    console.log('The first 100 articles are sorted from newest to oldest.');
  } else {
    console.log('The first 100 articles are NOT sorted correctly.');
  }

  // Close the browser
  await browser.close();
})();
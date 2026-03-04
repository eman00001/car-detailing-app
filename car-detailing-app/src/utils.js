// stores the names for the days of the week, with the indexes matching with those returned from Date.getDay()
const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

// function checks if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear()
        && date1.getMonth()    === date2.getMonth()
        && date1.getDate()     === date2.getDate();
}

// function checks if date is within one week of another
function isWithinWeek(checkDate, currDate) {
    currDate = new Date(currDate);   // create copies so don't mess with references
    checkDate = new Date(checkDate);

    currDate.setHours(0, 0, 0, 0);  // reset dates to midnight so comparable by days only
    checkDate.setHours(0, 0, 0, 0);

    const lastWeekDate = new Date(currDate);  // find last week's date
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    // see if the check date is after last week and not passed the current date
    return checkDate > lastWeekDate && checkDate <= currDate;
}

// function formats a date and time into a friendly format, supporting today, yesterday, and days of weeks
export function formatDateTime(dateTime) {
    // get current date to see today
    const today = new Date();

    // calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let dayString; // holds the day portion of the formatted string

    // if dateTime is today, set day string to today
    if (isSameDay(dateTime, today)) {
        dayString = 'Today';

    // if dateTime is yesterday, set day string to yesterday
    } else if (isSameDay(dateTime, yesterday)) {
        dayString = 'Yesterday';

    // if dateTime is within week, set day string to day of week of date
    } else if (isWithinWeek(dateTime, today)) {
        dayString = DAYS_OF_WEEK[dateTime.getDay()];
    
    // if dateTime has same year as now, don't include in formatted date
    } else if (dateTime.getFullYear() === today.getFullYear()) {
        dayString = dateTime.toLocaleDateString('en-us', {
            month: 'short',
            day: 'numeric',
        });

    // otherwise, set day string to entire date
    } else {
        dayString = dateTime.toLocaleDateString('en-us', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    // format time portion of dateTime, without seconds
    const timeString = dateTime.toLocaleTimeString('en-us', {
        hour: 'numeric',
        minute: '2-digit',
    });

    // return the day and time concatenated
    return `${dayString}, ${timeString}`;
}
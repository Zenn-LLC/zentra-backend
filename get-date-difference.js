async function dateDifference(date1, date2) {
    const diff = Math.abs(parseInt(date2) - parseInt(date1.getTime()));
    var value
    var metric;
    if (diff < 60 * 1000) {
        value = Math.floor(diff/1000);
        if (value == 1) {
            metric = "second";
        } else {
            metric = "seconds";
        }
    } else if (diff >= 60 * 1000 && diff < 60 * 60 * 1000) {
        value = Math.floor(diff/(60 * 1000));
        if (value == 1) {
            metric = "minute";
        } else {
            metric = "minutes";
        }
    } else if (diff >= 60 * 60 * 1000 && diff < 60 * 60 * 24 * 1000) {
        value = Math.floor(diff/(60 * 60 * 1000));
        if (value == 1) {
            metric = "hour";
        } else {
            metric = "hours";
        }
    } else if (diff >= 60 * 60 * 24 * 1000 && diff < 60 * 60 * 24 * 30 * 1000) {
        value = Math.floor(diff/(60 * 60 * 24 * 1000));
        if (value == 1) {
            metric = "day";
        } else {
            metric = "days";
        }
    } else if (diff >= 60 * 60 * 24 * 30 * 1000 && diff < 60 * 60 * 24 * 30 * 12 * 1000) {
        value = Math.floor(diff/(60 * 60 * 24 * 30 * 1000));
        if (value == 1) {
            metric = "month";
        } else {
            metric = "months";
        }
    } else if (diff >= 60 * 60 * 24 * 30 * 12 * 1000) {
        value = Math.floor(diff/(60 * 60 * 24 * 30 * 12 * 1000));
        if (value == 1) {
            metric = "year";
        } else {
            metric = "years";
        }
    } else {
        value = 100;
        metric = "years";
    }

    const timeDifference = {
        value: value,
        metric: metric
    };
    
    return timeDifference;
}

module.exports = {
    dateDifference: dateDifference,
}
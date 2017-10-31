const Dropbox = require('dropbox');
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;

const dbx = new Dropbox({accessToken: DROPBOX_TOKEN});
const _ = require('lodash');
const Q = require('q');
const interpolation = require('../processing/interpolation');

function all() {
    let d = Q.defer();
    dbx.filesListFolder({path: ''})
        .then(function (response) {
            let entries = response.entries;
            let files = _.map(_.filter(entries, function (item) {
                return item['.tag'] === 'file'
            }), function (f) {
                return f.path_lower;
            });
            let folders = _.map(_.filter(entries, function (item) {
                return item['.tag'] === 'folder'
            }), function (f) {
                return f.path_lower;
            });

            getFiles(folders).then(function (otherFiles) {
                downloadFiles(_.concat(files, otherFiles)).then(function (result) {
                    d.resolve(result);
                });

            });
        }).catch(function (error) {
        console.log(error);
        d.reject();
    });
    return d.promise;
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function save(item) {
    dbx.filesUpload({contents: JSON.stringify(item), path: getCurrentFolder() + '/' + guid() + '.json'})
        .then(function (response) {
            console.log(response);
        }).catch(function (error) {
        console.log(error);
    });
}

function getCurrentDate() {
    return getLocalDate(new Date());
}

function getLocalDate(date) {
    return new Date(date.getTime() + 1000 * 60 * 60 * 3);
}

function getCurrentFolder() {
    return getFolderByDate(getCurrentDate());
}

function getFolderByDate(date) {
    return '/' + date.toISOString().split('T')[0];
}

function getFolderFiles(folder) {
    let d = Q.defer();

    dbx.filesListFolder({path: folder})
        .then(function (response) {
            let files = _.map(_.filter(response.entries, function (item) {
                return item['.tag'] === 'file'
            }), function (f) {
                return f.path_lower
            });
            d.resolve(files);
        }).catch(function (error) {
        console.log(error);
    });

    return d.promise;
}

function getFiles(folders) {
    let d = Q.defer();
    let promises = _.map(folders, function (folder) {
        return getFolderFiles(folder)
    });

    Q.all(promises).then(function (result) {
        d.resolve(_.flatMap(result, function (f) {
            return f
        }));
    });
    return d.promise;
}

function downloadFolder(folder) {
    let defer = Q.defer();
    getFiles([folder])
        .then(files => {
            downloadFilesSync(files, defer, [])
        });
    return defer.promise;
}

function downloadFilesSync(files, defer, result) {
    if (!files || files.length === 0) {
        defer.resolve(result)
    } else {
        console.log('Download Queue size: ', files.length);
        let file = files.pop();
        downloadFile(file)
            .then(c => {
                result.push(c);
                downloadFilesSync(files, defer, result);
            })
    }
}


function downloadFiles(files) {
    let d = Q.defer();
    Q.all(_.map(files, function (f) {
        return downloadFile(f);
    })).then(function (result) {
        d.resolve(result);
    });
    return d.promise;
}


function downloadFile(file) {
    var d = Q.defer();
    dbx.filesDownload({path: file}).then(function (response) {
        d.resolve({
            content: response.fileBinary,
            path: response.path_lower,
            timestamp: response.client_modified
        })
    }).catch(function (error) {
        console.log(error);
    });
    return d.promise;
}

function getDHT(from, to) {
    if (!from && !to)
        return lastDHT();
    return lastDHT();
}

function lastDHT() {

    let d = Q.defer();
    dbx.filesListFolder({path: getCurrentFolder()})
        .then(function (response) {
            let entries = _.map(response.entries, e => {
                e.timestamp = new Date(e.client_modified).getTime();
                return e;
            });

            let last = _.sortBy(entries, 'timestamp')[entries.length - 1];

            let file = last.path_lower;

            downloadFile(file)
                .then(f => JSON.parse(f.content))
                .then(v => _.orderBy(v, 'timestamp')[v.length - 1])
                .then(v => d.resolve(v));
        }).catch(function (error) {
        console.log(error);
        d.reject();
    });
    return d.promise;
}

function isExistsFolder(folder) {
    return dbx.filesListFolder({path: ''})
        .then(res => _.find(res.entities, e => e.path_lower === folder));
}

// for tests
function fromFolder(path) {
    let defer = Q.defer();
    let fs = require('fs');
    fs.readdir(path, (err, files) => {
        if (err) console.log(err);
        let items = _.map(files, file => {
            return {content: fs.readFileSync(path + '/' + file, {encoding: 'utf-8'})};
        });
        defer.resolve(items);
    });
    return defer.promise;
}

function toFolder(path, data) {
    let defer = Q.defer();
    let fs = require('fs');
    fs.writeFile(path, JSON.stringify(data), (err) => {
        if (err) throw err;
        defer.resolve(data);
    });

    return defer.promise;
}

function createDayArchiveBy(src, dst) {
    // return downloadFolder(src)
    return fromFolder('../processing/2017-10-30')
        .then(data => {
            let flatData = _.flatMap(data, d => JSON.parse(d.content));
            let pinsData = {};
            let minTime = undefined;
            let maxTime = undefined;
            _.forEach(flatData, item => {
                let time = new Date(item.timestamp).getTime();
                minTime = minTime ? (minTime > time ? time : minTime) : time;
                maxTime = maxTime ? (maxTime > time ? maxTime : time) : time;

                _.forEach(item.data, j => {
                    pinsData[j.dht] = pinsData[j.dht] || {t: [], h: []};
                    pinsData[j.dht].t.push([time, parseFloat(j.t)]);
                    pinsData[j.dht].h.push([time, parseFloat(j.h)]);
                })
            });

            let pointsCount = 24;
            let step = (maxTime - minTime) / (pointsCount - 1);

            let pinsAggData = {};
            for (let pin in pinsData) {
                let tempFunc = interpolation(pinsData[pin].t);
                let humFunc = interpolation(pinsData[pin].h);
                pinsAggData[pin] = {t: [], h: []};
                for (let i = 0; i < pointsCount; i++) {
                    let time = minTime + i * step;
                    let timeStr = getLocalDate(new Date(time)).toISOString();
                    let timestamp = timeStr.substring(0, timeStr.indexOf('.'));
                    pinsAggData[pin].t.push({time: time, value: tempFunc(time), timestamp: timestamp});
                    pinsAggData[pin].h.push({time: time, value: humFunc(time), timestamp: timestamp});
                }
            }
            return pinsAggData;
        })
        //todo save to dropbox
        .then(res => toFolder('2017-10-30_archive.json', res))
}

function getDHTForDay() {
    let defer = Q.defer();
    let currentDate = getCurrentDate();
    let yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    let folder = getFolderByDate(yesterday);
    let archiveFolder = folder + '_archive';
    isExistsFolder(archiveFolder)
        .then(isExists => {
            if (isExists) {
                downloadFolder(archiveFolder)
                    .then(res => defer.resolve(res));
            } else {
                createDayArchiveBy(folder, archiveFolder)
                    .then(res => defer.resolve(res));
            }
        });

    return defer.promise;
}

module.exports = {
    all: all,
    save: save,
    getDHT: getDHT,
    getCurrentDate: getCurrentDate,
    getDHTForDay: getDHTForDay
};
const Dropbox = require('dropbox');
const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;

const dbx = new Dropbox({ accessToken: DROPBOX_TOKEN });
const _ = require('lodash');
const Q = require('q');

function all () {
    let d = Q.defer();
    dbx.filesListFolder({path: ''})
      .then(function(response) {
        let entries = response.entries;

        let files = _.map(_.filter(entries, function(item) { return item['.tag'] === 'file'}), function(f){return f.path_lower;});
        let folders = _.map(_.filter(entries, function(item) { return item['.tag'] === 'folder'}), function(f){return f.path_lower;});

        getFiles(folders).then(function(otherFiles){
            downloadFiles(_.concat(files, otherFiles)).then(function(result){
                d.resolve(result);
            });

        });
      }).catch(function(error) {
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
    dbx.filesUpload({ contents: JSON.stringify(item), path: '/' + new Date().toISOString().split('T')[0] + '/'+guid()+'.json'})
    .then(function(response) {
        console.log(response);
    }).catch(function(error) {
      console.log(error);
    });
}

function getFolderFiles(folder) {
    var d = Q.defer();

    dbx.filesListFolder({path: folder})
        .then(function(response) {
            let files = _.map(_.filter(response.entries, function(item){return item['.tag'] === 'file'}), function(f){return f.path_lower});
            console
            d.resolve(files);
        }).catch(function(error) {
              console.log(error);
            });

    return d.promise;
}

function getFiles(folders) {
    var d = Q.defer();
    var promises = _.map(folders, function(folder){return getFolderFiles(folder)});

    Q.all(promises).then(function(result){
        d.resolve(_.flatMap(result, function(f){return f}));
    });
    return d.promise;
}

function downloadFiles(files) {
    var d = Q.defer();
    Q.all(_.map(files, function(f){return downloadFile(f);}))
    .then(function(result) {
        d.resolve(result);
    })
    return d.promise;
}


function downloadFile(file) {
    var d = Q.defer();
    dbx.filesDownload({path:file}).then(function(response){
        d.resolve(response.fileBinary)
    }).catch(function(error) {
        console.log(error);
      });
    return d.promise;
}

module.exports = {
    all:all,
    save:save
};
var papa = require('papaparse');
var fs = require('fs');
var path = require('path');

function parseCsvPromise() {
    return new Promise(function (resolve, reject) {

        var csvUrl = path.join(__dirname, '../FOX_News/UrlToHtml_foxnews.csv');
        fs.readFile(csvUrl, 'utf8', function (err, csvString) {
            if (err) {
                reject(err);
                return console.log(err);
            }
            papa.parse(csvString, {
                delimiter: ',',
                complete: function (result) {
                    var parsedPairs = result.data;
                    var nameUrlMap = toMap(parsedPairs);
                    resolve(nameUrlMap);
                }
            })
        })

    });
}

function toMap(pairs) {
    var map = {};
    pairs.forEach(function (pair) {
        map[pair[0]] = pair[1];
    });
    return map;
}


module.exports = parseCsvPromise();
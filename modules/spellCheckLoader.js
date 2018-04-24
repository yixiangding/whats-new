var spell = require('spell');
var fs = require('fs');
var path = require('path');

module.exports = function getLoadSpellCheckerPromise() {
    var spellChecker = spell();
    var pathToBigTxt = global.inDevelopment ? path.join(__dirname, '../small.txt') : path.join(__dirname, '../big.txt');
    return new Promise(function (resolve, reject) {
        fs.readFile(pathToBigTxt, { encoding: 'utf8' }, function (err, text) {
            if (err) {
                return console.log("Error happened when parsing big.txt");
            }
            spellChecker.load(text);
            console.log("spell checker loaded");
            resolve(spellChecker);
            // console.log(spellChecker.suggest('the'));
        });
    });
};
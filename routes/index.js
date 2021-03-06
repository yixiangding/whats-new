var express = require('express');
var router = express.Router();
var solr = require('solr-client');
var fs = require('fs');
var path = require('path');
var axios = require('axios');
var parseCsvPromise = require('../modules/parseCsv');
var spellCheckLoader = require('../modules/spellCheckLoader');
var snippetMaker = require('../modules/snippetMaker');

var loadSpellCheckerPromise = spellCheckLoader();
const pathToHtmls = rootPath + '/FOX_NEWS/HTML_files';

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'What\'s New' });
});

/*
    GET: get auto-complete suggestion
 */
router.get('/autocomplete', function (req, res) {
    var currentInput = req.query.currentInput;
    var termsArray = currentInput.split(' ');
    var termToComplete = termsArray[termsArray.length - 1];
    console.log('to complete:', termToComplete);
    var solrSuggestEndpoint = 'http://localhost:8983/solr/Lucene/suggest?q=' + termToComplete;
    axios.get(solrSuggestEndpoint).then(function (response) {
        var suggestions = response.data.suggest.suggest[termToComplete].suggestions;
        suggestions.sort(function (a, b) {
            return b.weight - a.weight;
        });
        var terms = suggestions.map(function (item) {
            termsArray[termsArray.length - 1] = item.term;
            return termsArray.join(' ');
        });
        res.send(terms);
    }).catch(function (error) {
        console.log(error);
        res.send([]);
    });
});


var nameUrlMapPromise = parseCsvPromise.then(function (data) {
    console.log("name -> url map promised");
    return data;
})
    .catch(function (err) {
        return err;
    });

/*
    POST: Lucene (default) Algorithm Endpoint
 */
router.get('/lucene', function (req, res) {
    var inputTerms = req.query.input;
    if (!inputTerms) {
        res.send('no result');
        return;
    }
    var solrClient = solr.createClient({
        "host": solrDomainName,
        "port": 8983,
        "path": "/solr",
        "core": "Lucene"
    });
    loadSpellCheckerPromise.then(function (spellChecker) {
        nameUrlMapPromise.then(function (nameUrlMap) {
            renderResultAndCorrection(spellChecker, nameUrlMap);
        });
    });


    function renderResultAndCorrection(spellChecker, nameUrlMap) {

        var correctedTerms = getCorrectedTerms(spellChecker);
        console.log('corrected terms:', correctedTerms, '| original terms:', inputTerms);
        if (correctedTerms.toLowerCase() === inputTerms.toLowerCase()) {
            renderResultPage(inputTerms, nameUrlMap, res, solrClient);
        } else {
            console.log("passed spell correction as:", correctedTerms);
            renderResultPage(inputTerms, nameUrlMap, res, solrClient, correctedTerms);
        }
    }

    function getCorrectedTerms(spellChecker) {
        var inputTermArray = inputTerms.split(' ');
        var isCorrected = false;
        var correctedTermArray = [];
        inputTermArray.forEach(function (term) {
            var suggestedTerm = spellChecker.suggest(term)[0];
            if (!suggestedTerm) {
                return correctedTermArray.push(term);
            }
            suggestedTerm = suggestedTerm['word'];
            if (suggestedTerm !== term) {
                isCorrected = true;
            }
            correctedTermArray.push(suggestedTerm);
        });
        return correctedTermArray.join(' ');
    }

});

function renderResultPage(inputTerms, nameUrlMap, res, solrClient, correctedTerms) {
    var query = createLuceneQuery(inputTerms, solrClient);
    solrClient.search(query, function (err, obj) {
        if (err) {
            console.log(err);
            res.render('result', { res: err });
        } else {
            var docs = obj["response"]["docs"];
            if (docs.length !== 0) {
                var itemsToShow = getItemsToShow(docs, nameUrlMap, inputTerms);
                // Export result to .txt file (to populate into table)
                // writeToTxt(itemsToShow);
                res.render('result', { items: itemsToShow, correctedTerms: correctedTerms });
            } else {
                res.render('result', { items: {err: "No Results Found"}, correctedTerms: correctedTerms });
            }
        }
    });
}

function createLuceneQuery(inputTerms, solrClient) {
    return solrClient.createQuery().q(inputTerms).start(0).rows(10);
}

function getItemsToShow(docs, nameUrlMap, inputTerms) {
    var items = [];
    docs.forEach(function (item, index) {
        var id = item['id'];
        var shortId = id.substring(id.lastIndexOf('/') + 1);
        var url = nameUrlMap[shortId];
        var filePath = pathToHtmls + '/' + shortId;
        // var description = item['description'];
        var description = snippetMaker.getSnippet(filePath, inputTerms);
        var title = item['title'];
        var newItem = {
            id: id,
            shortId: shortId,
            url: url,
            description: description,
            title: title
        };
        items.push(newItem);
    });
    return items;
}

function writeToTxt(itemsToShow) {
    var toWrite = "";
    var count = 1;
    itemsToShow.forEach(function (item) {
        toWrite += count++ + "," + item.shortId + "," + item.url + '\n';
    });
    toWrite += '\n' + '-------------------------------' + '\n';
    fs.appendFile(path.join(__dirname, '../url_table.txt'), toWrite, function (err) {
        if (err)
            throw err;
        console.log("Write to TXT complete");
    })
}

/*
    POST: Page Rank Algorithm Endpoint
 */
router.post('/pagerank', function (req, res) {

    var terms = req.body.input;
    if (!terms) {
        res.render('error');
        return;
    }

    var solrClient = solr.createClient({
        "host": solrDomainName,
        "port": 8983,
        "path": "/solr",
        "core": "PR"
    });

    nameUrlMapPromise.then(function (nameUrlMap) {
        var prQuery = createPrQuery();
        renderResultPage(prQuery, nameUrlMap, res, solrClient);
    });

    function createPrQuery() {
        return solrClient.createQuery().q(terms).sort({ pr: 'desc' }).start(0).rows(10);
    }

});

module.exports = router;

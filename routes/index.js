var express = require('express');
var router = express.Router();
var solr = require('solr-client');
var parseCsvPromise = require('../modules/parseCsv');
var fs = require('fs');
var path = require('path');
var axios = require('axios');


var nameUrlMapPromise = parseCsvPromise.then(function (data) {
    console.log("map promised");
    return data;
})
    .catch(function (err) {
        return err;
    });

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'What\'s New' });
});

/*
    GET: get auto-complete suggestion
 */
router.get('/autocomplete', function (req, res) {
    var currentInput = req.query.currentInput;
    var solrSuggestEndpoint = 'http://localhost:8983/solr/Lucene/suggest?q=' + currentInput;
    axios.get(solrSuggestEndpoint).then(function (response) {
        var suggestions = response.data.suggest.suggest[currentInput].suggestions;
        suggestions.sort(function (a, b) {
            return b.weight - a.weight;
        });
        var terms = suggestions.map(function (item) { return item.term });
        res.send(terms);
    }).catch(function (error) {
        console.log(error.data);
        res.send([]);
    });
    // // make a axios call to solr
    // var availableTags = [
    //     "ActionScript",
    //     "AppleScript",
    //     "Asp",
    //     "BASIC",
    //     "C",
    //     "C++",
    //     "Clojure",
    //     "COBOL",
    //     "ColdFusion",
    //     "Erlang",
    //     "Fortran",
    //     "Groovy",
    //     "Haskell",
    //     "Java",
    //     "JavaScript",
    //     "Lisp",
    //     "Perl",
    //     "PHP",
    //     "Python",
    //     "Ruby",
    //     "Scala",
    //     "Scheme"
    // ];
    // res.send(availableTags);
});

/*
    POST: Lucene (default) Algorithm Endpoint
 */
router.post('/lucene', function (req, res) {
    
    var terms = req.body.input;
    if (!terms) {
        res.render('error');
        return;
    }

    var solrClient = solr.createClient({
        "host": solrDomainName,
        "port": 8983,
        "path": "/solr",
        "core": "Lucene"
    });

    nameUrlMapPromise.then(function (nameUrlMap) {
        var luceneQuery = createLuceneQuery();
        renderSearchResult(luceneQuery, nameUrlMap, res, solrClient);
    });

    function createLuceneQuery() {
        return solrClient.createQuery().q(terms).start(0).rows(10);
    }

});

function renderSearchResult(query, nameUrlMap, res, solrClient) {
    solrClient.search(query, function (err, obj) {
        if (err) {
            console.log(err);
            res.render('result', { res: err });
        } else {
            var docs = obj["response"]["docs"];
            if (docs.length !== 0) {
                var itemsToShow = getItemsToShow(docs, nameUrlMap);
                // Export result to .txt file (to populate into table)
                // writeToTxt(itemsToShow);
                res.render('result', { items: itemsToShow });
            } else {
                res.render('result', { items: {err: "No Results Found"} });
            }
        }
    });
}

function getItemsToShow(docs, nameUrlMap) {
    var items = [];
    docs.forEach(function (item) {
        var id = item['id'];
        var shortId = id.substring(id.lastIndexOf('/') + 1);
        var url = nameUrlMap[shortId];
        var description = item['description'];
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
        renderSearchResult(prQuery, nameUrlMap, res, solrClient);
    });

    function createPrQuery() {
        return solrClient.createQuery().q(terms).sort({ pr: 'desc' }).start(0).rows(10);
    }

});

module.exports = router;

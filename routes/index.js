var express = require('express');
var router = express.Router();
var solr = require('solr-client');
var parseCsvPromise = require('../modules/parseCsv');

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
    POST: Lucene (default) Algorithm
 */
router.post('/lucene', function (req, res) {
    
    var terms = req.body.input;
    if (!terms) {
        res.render('error');
        return;
    }

    var solrClient = solr.createClient({
        "host": "127.0.0.1",
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
            url: url,
            description: description,
            title: title
        };
        items.push(newItem);
    });
    return items;
}


/*
    POST: Page Rank Algorithm
 */
router.post('/pagerank', function (req, res) {

    var terms = req.body.input;
    if (!terms) {
        res.render('error');
        return;
    }

    var solrClient = solr.createClient({
        "host": "127.0.0.1",
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

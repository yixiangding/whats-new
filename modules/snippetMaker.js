var extractor = require('unfluff');
var fs = require('fs');

module.exports = {
    getSnippet: function (pathToFile, terms) {
        var html = this.getHtmlText(pathToFile);
        var parsedHtml = extractor(html);
        var content = parsedHtml.text;
        // var rawSnippet = this.findSentence(terms, content);
        var rawSnippet = this.findSentence(terms, content);
        var formattedSnippet = this.formatSnippet(rawSnippet);
        var highlightedSnippet = this.highlight(formattedSnippet, terms);
        return highlightedSnippet;
    },
    
    getHtmlText: function (pathToFile) {
        return fs.readFileSync(pathToFile).toString();
    },

    findSentence: function (terms, content) {
        var sentences = this.getSentencesFromContent(content);
        var perfectMatch = this.findPerfectMatch(terms, sentences);
        if (perfectMatch) {
            console.log("perfect match");
            return perfectMatch;
        }
        var termsArray = terms.split(' ');
        var fittedMatch = this.findFittedMatch(termsArray, sentences);
        if (fittedMatch) {
            console.log("fitted match");
            return fittedMatch;
        }
        var leastMatch = this.findLeastMatch(termsArray, sentences);
        console.log("least match");
        return leastMatch;
    },

    getSentencesFromContent: function (content) {
        return content.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    },

    findPerfectMatch: function (terms, sentences) {
        for (var i in sentences) {
            var sentence = sentences[i];
            var index = sentence.toLowerCase().indexOf(terms);
            if (index !== -1)
                return sentence;
        }
        return '';
    },

    findFittedMatch: function (termsArray, sentences) {
        for (var i in sentences) {
            var sentence = sentences[i];
            if (this.containsAll(sentence.toLowerCase(), termsArray))
                return sentence;
        }
        return '';
    },

    containsAll: function (sentence, termsArray) {
        for (var i in termsArray) {
            var term = termsArray[i];
            if (sentence.indexOf(term) === -1)
                return false;
        }
        return true;
    },

    findLeastMatch: function (termsArray, sentences) {
        for (var i in sentences) {
            var sentence = sentences[i];
            if (this.containsOne(sentence.toLowerCase(), termsArray))
                return sentence;
        }
        return '';
    },

    containsOne: function (sentence, termsArray) {
        for (var i in termsArray) {
            var term = termsArray[i];
            if (sentence.indexOf(term) !== -1)
                return true;
        }
        return false;
    },

    formatSnippet: function (rawSnippet) {
        var formattedSnippet = rawSnippet ? '...' + rawSnippet + '...' : '';
        return formattedSnippet;
    },

    highlight: function (formattedSnippet, terms) {
        var termsArray = terms.split(' ');
        for (var i in termsArray) {
            var term = termsArray[i];
            var highlightedSnippet = formattedSnippet.replace(new RegExp(term, "gi"), '<b>' + term + '</b>');
        }
        return highlightedSnippet;
    }
};
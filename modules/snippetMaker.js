var htmlToText = require('html-to-text');
var fs = require('fs');

module.exports = {
    getSnippet: function (pathToFile, terms) {
        var html = this.getHtmlText(pathToFile);
        var content = htmlToText.fromString(html, {
            ignoreHref: true,
            ignoreImage: true
        });
        var rawSnippet = this.findSentence(terms, content);
        var formattedSnippet = this.formatSnippet(rawSnippet, terms);
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
            var index = sentence.toLowerCase().indexOf(terms.toLowerCase());
            if (index !== -1)
                return sentence;
        }
        return '';
    },

    findFittedMatch: function (termsArray, sentences) {
        for (var i in sentences) {
            var sentence = sentences[i];
            if (this.containsAll(sentence, termsArray))
                return sentence;
        }
        return '';
    },

    containsAll: function (sentence, termsArray) {
        for (var i in termsArray) {
            var term = termsArray[i].toLowerCase();
            if (sentence.toLowerCase().indexOf(term) === -1)
                return false;
        }
        return true;
    },

    findLeastMatch: function (termsArray, sentences) {
        for (var i in sentences) {
            var sentence = sentences[i];
            console.log("least:", sentence);
            if (this.containsOne(sentence, termsArray))
                return sentence;
        }
        return '';
    },

    containsOne: function (sentence, termsArray) {
        for (var i in termsArray) {
            var term = termsArray[i].toLowerCase();
            if (sentence.toLowerCase().indexOf(term) !== -1)
                return true;
        }
        return false;
    },

    formatSnippet: function (rawSnippet, terms) {
        if (rawSnippet.length > 160) {
            var firstIndex = this.getFirstIndex(rawSnippet, terms);
            console.log('firstIndex', firstIndex)
            rawSnippet = rawSnippet.substring(firstIndex, firstIndex + 160);
        }
        var formattedSnippet = rawSnippet ? '...' + rawSnippet + '...' : '';
        return formattedSnippet;
    },

    getFirstIndex: function (rawSnippet, terms) {
        if (!rawSnippet) return 0;
        var termsArray = terms.split(' ');
        var firstIndex = Number.MAX_VALUE;
        for (var i in termsArray) {
            var term = termsArray[i];
            var index = rawSnippet.toLowerCase().indexOf(term.toLowerCase());
            console.log('new index: ', index, 'term:', term.toLowerCase())
            if (index !== -1) {
                firstIndex = Math.min(firstIndex, index);
            }
        }
        return firstIndex;
    },

    highlight: function (formattedSnippet, terms) {
        var termsArray = terms.split(' ');
        var highlightedSnippet = formattedSnippet;
        for (var i in termsArray) {
            var term = termsArray[i];
            var highlightedSnippet = highlightedSnippet.replace(new RegExp(term, "gi"), '<b>' + term + '</b>');
        }
        return highlightedSnippet;
    }
};
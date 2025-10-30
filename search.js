require('dotenv').config();

const mongoURI = process.env.DATABASE_URL;

const mongoose = require('mongoose');
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true});

require('./model/Account.js');
const Account = mongoose.model('accounts');

async function retrieveSearch(req, res) {
    try {
        const pipeline1 = [
            {
                '$search': {
                    'index': 'account_retrieval',
                    'text': {
                        'query': req.query.query,
                        'path': 'username'
                    }
                }
            }
        ];
        const pipeline2 = [
            {
                '$search': {
                    'index': 'account_retrieval',
                    'text': {
                        'query': req.query.query,
                        'path': 'idName'
                    }
                }
            }
        ];
        const pipeline3 = [
            {
                '$search': {
                    'index': 'account_retrieval',
                    'text': {
                        'query': req.query.query,
                        'path': 'firstName'
                    }
                }
            }
        ];
        const pipeline4 = [
            {
                '$search': {
                    'index': 'account_retrieval',
                    'text': {
                        'query': req.query.query,
                        'path': 'lastName'
                    }
                }
            }
        ];
        const pipeline5 = [
            {
                '$search': {
                    'index': 'account_retrieval',
                    'text': {
                        'query': req.query.query,
                        'path': 'otherName'
                    }
                }
            }
        ];
        var searchResults = [];

        var searchResults1 = [];
        var searchResults2 = [];
        var searchResults3 = [];
        var searchResults4 = [];
        var searchResults5 = [];
        
        if (req.query.query != "") {
            searchResults1 = await Account.aggregate(pipeline1);
            searchResults2 = await Account.aggregate(pipeline2);
            searchResults3 = await Account.aggregate(pipeline3);
            searchResults4 = await Account.aggregate(pipeline4);
            searchResults5 = await Account.aggregate(pipeline5);

            searchResults = searchResults1.concat(searchResults2.concat(searchResults3.concat(searchResults4.concat(searchResults5))));
        }

        const uniqueArray = searchResults.filter((obj, index, self) =>
            index === self.findIndex((t) => (
                t.username === obj.username && JSON.stringify(t) === JSON.stringify(obj)
            ))
        );

        const accounts = [];
        for (var i = 0; i < uniqueArray.length; i++) {
            const account = {
                username: uniqueArray[i].username,
                idName: uniqueArray[i].idName,
                about: uniqueArray[i].about,
            }
            accounts.push(account);
        }
        const dat = {
            data: accounts
        }
        res.send(dat);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    retrieveSearch: retrieveSearch
}
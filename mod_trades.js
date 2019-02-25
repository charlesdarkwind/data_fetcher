/**
 * trades
 * @module charlesdarkwind/data_fetcher
 * @return {object} instance to class object
 */
let TradesManager = function () {
    'use strict';

    const fs = require('fs');
    const zlib = require('zlib');
    const {getExchangeInfos, getBtcPairs, getPairs} = require('./mod_pairs');
    const binance = require('./binance');
    const params = require('./params.json');
    let tradesMain = {};
    let exchangeInfos = {};
    let allPairsBTC = [];
    let pairs = [];
    let options = {
        saveInterval: 1000 * 60 * 60, // 1h. Every files corresponds to 1 hour of trades for all pairs
        pairsNum: 100
    };


    const savePeriodically = () => {
        setInterval(() => {
            const tmp = tradesMain;
            tradesMain = {};
            pairs.map(pair => tradesMain[pair] = []);

            if (!fs.existsSync('./trades')) fs.mkdirSync('./trades'); // Create folder

            const gzip = zlib.createGzip({level: 9});
            const name = `./trades/trades_${Date.now()}.json.gz`;
            const data = JSON.stringify(tmp, null, 0);
            const out = fs.createWriteStream(name);

            gzip.pipe(out);
            gzip.write(data, (err) => {
                if (err) throw err;
                gzip.end();
            });
        }, options.saveInterval);
    };
    return {


        init: async function () {
            // exchangeInfos = await getExchangeInfos();
            // allPairsBTC = getBtcPairs(exchangeInfos, params.excludedPairs);
            // pairs = await getPairs(allPairsBTC, params.excludedPairs);
            // pairs = pairs.slice(0, options.pairsNum);
            pairs = params.pairs;
            pairs.map(pair => tradesMain[pair] = []); // Every pair obj in tradesMain is an arr into wich new trades are pushed
        },


        startWS: function () {
            binance.websockets.trades(pairs, trades => tradesMain[trades.s].push(trades));
        },


        startSaving: function () {
            savePeriodically();
        }
    };
};
module.exports = TradesManager;
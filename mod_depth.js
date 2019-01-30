/**
 * depth
 * @module charlesdarkwind/data_fetcher
 * @return {object} instance to class object
 */
let DepthManager = function () {
    'use strict';

    const fs = require('fs');
    const zlib = require('zlib');
    const {getExchangeInfos, getBtcPairs, getPairs} = require('./mod_pairs');
    const binance = require('./binance');
    const params = require('./params.json');
    const depthMain = {};
    let exchangeInfos = {};
    let allPairsBTC = [];
    let pairs = [];
    let options = {
        saveInterval: 10000,
        pairsNum: 100
    };


    /**
     * Start periodically saving depth of all pairs to a new file at each intervals.
     * @returns {undefined}
     */
    const savePeriodically = () => {
        setInterval(() => {
            if (!fs.existsSync('./depths')) fs.mkdirSync('./depths'); // Create folder

            const gzip = zlib.createGzip({level: 9});
            const name = `./depths/depth_${Date.now()}.json.gz`;
            const data = JSON.stringify(depthMain, null, 0);
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
            exchangeInfos = await getExchangeInfos();
            allPairsBTC = getBtcPairs(exchangeInfos, params.excludedPairs);
            pairs = await getPairs(allPairsBTC, params.excludedPairs);
            pairs = pairs.slice(0, options.pairsNum);
        },


        startWS: function () {
            binance.websockets.depthCache(pairs, (symbol, depth) => depthMain[symbol] = depth);
        },


        startSaving: function () {
            savePeriodically();
        }
    };
};
module.exports = DepthManager;

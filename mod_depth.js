/**
 * depth
 * @module charlesdarkwind/data_fetcher
 * @return {object} instance to class object
 */
let DepthManager = function () {
    'use strict';

    const fs = require('fs');
    const zlib = require('zlib');
    const binance = require('./binance');
    const equal = require('fast-deep-equal');
    const params = require('./params.json');
    const {getExchangeInfos, getBtcPairs, getPairs} = require('./mod_pairs');
    const depthMain = {};
    let depthMain_old = '';
    let exchangeInfos = {};
    let allPairsBTC = [];
    let pairs = [];
    let stagnant = 0;
    let stopped = false;
    let options = {
        saveInterval: 10000,
        pairsNum: 100,
        maxDepth: 250
    };

    let lastRestarts = JSON.parse(fs.readFileSync('./lastRestarts.json'));


    /**
     * Reset last restarts after 10 mins of up-time so that future restarts are instant.
     */
    setTimeout(() => {
        lastRestarts = [];
        fs.writeFileSync('./lastRestarts.json', JSON.stringify(lastRestarts));
    }, 1000 * 60 * 10);


    /**
     * Append new date of now.
     * @returns {undefined}
     */
    const updateRestartsFile = () => {
        lastRestarts.push(Date.now());
        fs.writeFileSync('./lastRestarts.json', JSON.stringify(lastRestarts));
    };


    /**
     * Check for problems by verifying if the whole depth obj changes between 3 updates. Fix by exiting so pm2 reloads.
     * Delay goes up exponentialy after every occurences, wont ever go too high because of reset after 10mins.
     * 0, 30, 90, ... seconds.
     * @returns {undefined}
     */
    const checkForStagnancy = () => {
        if (!depthMain_old) return;
        if (equal(depthMain, depthMain_old)) {
            stagnant++;
            console.log('Stagnant depth data detected.');

            if (stagnant === 1) {

                const exp = 1 + (lastRestarts.length / 10);
                const delay = Math.pow(10000, exp);
                stopped = true;
                updateRestartsFile();
                console.log(`Stagnant again, restarting in ${Math.round(delay/1000)} seconds.`);

                setTimeout(() => {
                    console.log('Stopping now...');
                    process.exit(0);
                }, delay);
            }
        } else stagnant = 0;
    };


    /**
     * Limit depth size. Sort it to do so.
     * @returns {object}
     */
    const parseDepth = depth => {
        const bids = binance.sortBids(depth.bids, options.maxDepth);
        const asks = binance.sortAsks(depth.asks, options.maxDepth);
        depth.bids = bids;
        depth.asks = asks;
        return depth;
    };


    /**
     * Start periodically saving depth of all pairs to a new file at each intervals.
     * @returns {undefined}
     */
    const savePeriodically = () => {
        setInterval(() => {
            if (!fs.existsSync('./depths')) fs.mkdirSync('./depths'); // Create folder
            if (!stopped) {
                const gzip = zlib.createGzip({level: 9});
                const name = `./depths/depth_${Date.now()}.json.gz`;
                const data = JSON.stringify(depthMain, null, 0);
                const out = fs.createWriteStream(name);

                gzip.pipe(out);
                gzip.write(data, (err) => {
                    if (err) {
                        updateRestartsFile();
                        console.error(err);
                        process.exit(1);
                    }
                    gzip.end();

                    checkForStagnancy();
                    depthMain_old = depthMain;
                });
            }
        }, options.saveInterval);
    };
    return {

        init: async function () {
            exchangeInfos = await getExchangeInfos();
            allPairsBTC = getBtcPairs(exchangeInfos, params.excludedPairs);
            pairs = params.pairs;
            // pairs = await getPairs(allPairsBTC, params.excludedPairs);
            // pairs = pairs.slice(0, options.pairsNum);
        },


        startWS: function () {
            binance.websockets.depthCache(pairs, (symbol, depth) => depthMain[symbol] = parseDepth(depth));
        },


        startSaving: function () {
            savePeriodically();
        }
    };
};
module.exports = DepthManager;

/**
 * data_fetcher
 * @module charlesdarkwind/data_fetcher
 * @return {object} instance to class object
 */
const depthManager = async () => {
    let depthManager = this;
    'use strict';

    const { binance, getExchangeInfos, getBtcPairs, getPairs } = require('./mod_pairs');
    const excludedPairs = require('./params.json').excludedPairs;
    depthManager.exchangeInfos = await getExchangeInfos();
    const allPairsBTC = getBtcPairs(depthManager.exchangeInfos);

    const pairs = getPairs(allPairsBTC, excludedPairs);

    const startDepth = () => {

    };
};
module.exports = depthManager();
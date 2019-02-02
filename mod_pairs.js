const rp = require('request-promise');
const binance = require('./binance');

const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    qs: {
        start: 1,
        limit: 150,
        convert: 'BTC',
        sort: 'market_cap'
    },
    headers: {'X-CMC_PRO_API_KEY': process.env.CMC},
    json: true,
    gzip: true
};


/**
 * @returns {Promise<object>} - General infos of the exchange and the pairs
 */
exports.getExchangeInfos = () => new Promise((resolve, reject) => {
    binance.exchangeInfo((err, data) => err ? reject(err) : resolve(data));
});


/**
 * Get all BTC pairs of binance
 * @param exchangeInfos - Object obtained after GETting the endpoint with same name on Binance'e API
 * @param {array} excludedPairs - Array of pairs to exclude
 * @returns {array} - All BTC pairs of binance
 */
exports.getBtcPairs = (exchangeInfos, excludedPairs) => exchangeInfos.symbols.filter(
    pair => pair.quoteAsset === 'BTC'
        && pair.status === 'TRADING'
        && !excludedPairs.includes(pair))
    .map(pair => pair.symbol);


/**
 * Find pairs with highest market cap with regards to both a list to include and a list to exclude.
 * @param {array} pairsToInclude - Array of pairs of interest to work with
 * @param {array} excludedPairs - Array of pairs to exclude
 * @return {Promise<array>} result - Array of pairs with highest market cap
 */
exports.getPairs = (pairsToInclude, excludedPairs) => new Promise((resolve, reject) => {
    const result = [];
    rp(requestOptions).then(res => {
        res.data.map(body => {
            const pairName = `${body.symbol}BTC`;
            if (pairsToInclude.includes(pairName)
                && !excludedPairs.includes(pairName)
                && body.quote["BTC"].price > 0.00000200) {
                result.push(pairName);
            }
        });
        result.unshift('BTCUSDT')
        resolve(result);
    }).catch(err => reject(err));
});
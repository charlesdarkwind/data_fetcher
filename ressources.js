const Binance = require('node-binance-api');
const rp = require('request-promise');
const moment = require('moment');
const exchangeInfos = require('./exchangeInfos');
const fs = require('fs');

const binance = new Binance().options({
    test: false,
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET,
    useServerTime: true,
    recvWindow: 20000,
    verbose: true,
    log(...args) {
        console.warn(
            Array.prototype.slice.call(args),
            moment().format('MMM D, H:mm:ss')
        );
    }
});
exports.binance = binance;

exports.updateExchangeInfos = () => new Promise(resolve => {
    binance.exchangeInfo((err, data) => {
        if (err) console.log('system', 'Err while querying exchange infos.', err);
        else {
            fs.writeFileSync('./exchangeInfos.json', JSON.stringify(data));
            resolve();
        }
    });
});


const allPairsBTC = exchangeInfos.symbols
    .filter(pair => pair.quoteAsset == 'BTC' && pair.status == 'TRADING' && !excludedPairs.includes(pair))
    .map(pair => pair.symbol);
exports.allPairsBTC = allPairsBTC;


const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    qs: { start: 1, limit: 300, convert: 'BTC' },
    headers: { 'X-CMC_PRO_API_KEY': process.env.CMC },
    json: true,
    gzip: true
};


exports.getPairsByMarketCap = sort => new Promise(resolve => {
    const result = [];
    switch (sort) {
        case 'byMarketCap':
            requestOptions.qs.sort = 'market_cap';
            break;
        case 'byVolume':
            requestOptions.qs.sort = 'volume_24h';
            break;
    }
    if (sort === 'market_cap') requestOptions.qs.sort = 'market_cap';
    else if (sort === 'volume_24h') requestOptions.qs.sort = 'volume_24h';
    requestOptions.qs.limit = sort == 'byMarketCap' ? 200 : 300;
    rp(requestOptions)
        .then(res => {
            res.data.map(body => { // check if traded on binance
                const pairName = `${body.symbol}BTC`;
                if (allPairsBTC.includes(pairName)
                    && !excludedPairs.includes(pairName)
                    && body.quote.BTC.price > 0.00000200) {
                    result.push(pairName);
                }
            });
            fs.writeFileSync('./pairsToTest.json', JSON.stringify(result.slice(0, 70)));
            console.log('system', `CMC pairs sorted by ${sort} retrieved.`);
            resolve();
        }).catch(err => {
        console.log('system', 'CMC API call e, will fallback to pre-determined pairs.', err);
        fs.writeFileSync('./pairsToTest.json', JSON.stringify(pairsToTestFallBack));
        resolve();
    });
});
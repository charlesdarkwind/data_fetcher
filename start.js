require('dotenv').config({ path: 'variables.env' });
const DepthManager = require('./mod_depth');
const TradesManager = require('./mod_trades');

process.on('uncaughtException', err => console.log(err));
process.on('unhandledRejection', (reason, p) => console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason));

const start = async () => {
    const depthManager = new DepthManager();
    const tradesManager = new TradesManager();

    await depthManager.init();
    await tradesManager.init();

    depthManager.startWS();
    tradesManager.startWS();

    setTimeout(() => {
        tradesManager.startSaving();
        depthManager.startSaving();
    }, 5000);
};

start();
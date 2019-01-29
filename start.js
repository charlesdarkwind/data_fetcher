require('dotenv').config({ path: 'variables.env' });
const DepthManager = require('./mod_depth');

process.on('uncaughtException', err => console.log(err));
process.on('unhandledRejection', (reason, p) => console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason));

const start = async () => {
    const depthManager = new DepthManager();
    await depthManager.init();
    depthManager.startWS();
    setTimeout(() => depthManager.startSaving(), 10000);
};

start();
const { binance, updateExchangeInfos } = require('./ressources');

const depthManager = async () => {
    let depthManager = this;
    'use strict'

    // Update exchange infos json file
    await updateExchangeInfos(); // todo make return the obj AND write the file

    const startDepth = () => {

    };

};

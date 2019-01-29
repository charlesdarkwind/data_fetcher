const appController =  require('appController')

process.on('uncaughtException', err => {
    console.log(err);
});

process.on('unhandledRejection', (reason, p) => console.warn('Unhandled Rejection at: Promise', p, 'reason:', reason));

appController.startDepth()
var fs = require('fs');
var path = require('path');
var JSONBigInt = require('json-bigint');
const JSONBI = JSONBigInt({ useNativeBigInt: true });
var { ExplorerTokenMarket, PoolSample } = require('./dist/ExplorerTokenMarket');
var { ExplorerRequestManager } = require('./dist/ExplorerRequestManager');

const explorerTokenMarket = new ExplorerTokenMarket();
const explorerRequestManager = new ExplorerRequestManager();

const start = async () => {
  const { total: totalNumberOfBoxesToRetrieve } = await explorerRequestManager.requestWithRetries({
    url: `/api/v1/boxes/byErgoTree/${PoolSample}`,
    params: {
      limit: 1,
      offset: 0,
    },
    transformResponse: (data) => JSONBI.parse(data),
  });
  console.log('Going to request...', totalNumberOfBoxesToRetrieve);

  const fileToWriteTo = path.resolve(__dirname, '..', 'ergo-market-charts', 'src', 'ticker.json');
  console.log('Getting boxes now... then writing: ' + fileToWriteTo);
  const allBoxes = await explorerTokenMarket.getHistoricalTokenRates(totalNumberOfBoxesToRetrieve);
  // allBoxes.sort((a, b) => a.)
  console.log('Done! About to write file: ' + fileToWriteTo);
  fs.writeFileSync(fileToWriteTo, JSONBI.stringify([allBoxes]), 'utf-8');
}

start();
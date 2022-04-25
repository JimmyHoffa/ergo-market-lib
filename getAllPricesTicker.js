/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const JSONBigInt = require("json-bigint");

const JSONBI = JSONBigInt({ useNativeBigInt: true });
const { math } = require("./dist/math");
const {
  ExplorerTokenMarket,
  PoolSample,
  tokenSwapValueFromBox,
} = require("./dist/ExplorerTokenMarket");

const explorerTokenMarket = new ExplorerTokenMarket({
  timeout: 4000,
  retryCount: 10,
  retryWaitTime: 500,
});

const getFreshBoxes = true;
/* eslint-disable-next-line */
const start = async () => {
  let allBoxes = [];
  const boxesFile = path.resolve(__dirname, "allBoxes.json");
  if (getFreshBoxes) {
    const totalNumberOfBoxesToRetrieve =
      await explorerTokenMarket.getTotalBoxCount(
        `/api/v1/boxes/byErgoTree/${PoolSample}`
      );

    console.log("Going to request...", totalNumberOfBoxesToRetrieve);
    const ergoPoolBoxes = await explorerTokenMarket.getUniqueBoxesAtUri(
      `/api/v1/boxes/byErgoTree/${PoolSample}`,
      totalNumberOfBoxesToRetrieve
    );
    console.log("Going to request timestamps for...", ergoPoolBoxes.length);
    if (ergoPoolBoxes.length < 1) return []; // We couldn't get anything
    const timestampedBoxes = await explorerTokenMarket.getTimestampsForBoxes(
      ergoPoolBoxes
    );
    allBoxes = timestampedBoxes.sort((a, b) =>
      a.timestamp > b.timestamp ? 1 : -1
    );
    console.log(
      `Done! About to write file: ${boxesFile} with ${allBoxes.length} boxes`
    );
    fs.writeFileSync(boxesFile, JSONBI.stringify([allBoxes]), "utf-8");
  } else {
    /* eslint-disable-next-line  */
    allBoxes = require(boxesFile)[0];
  }

  console.log("Turning boxes into actual token swap rates...");
  const tokenRates = allBoxes.map(tokenSwapValueFromBox);
  console.log(
    `Got ${tokenRates.length} rates! Filtering out test pool boxes..`
  );
  const realPoolRates = [];
  tokenRates.reduce((acc, tokenRate) => {
    const {
      token: { tokenId },
    } = tokenRate;
    if (acc[tokenId] === undefined) acc[tokenId] = tokenRate;
    if (
      math.evaluate(`${tokenRate.ergAmount} > (${acc[tokenId].ergAmount} / 2)`)
    ) {
      realPoolRates.push(tokenRate);
      acc[tokenId] = tokenRate;
    }
    return acc;
  }, {});

  // const fileToWriteTo = path.resolve(__dirname, '..', 'ergo-market-charts', 'src', 'ticker.json');
  const fileToWriteTo = path.resolve(__dirname, "ticker.json");
  console.log(`Got ${realPoolRates.length} real pool rates after filtering!`);
  console.log(`Writing now to ${fileToWriteTo}`);
  fs.writeFileSync(fileToWriteTo, JSONBI.stringify([realPoolRates]), "utf-8");
};

start();

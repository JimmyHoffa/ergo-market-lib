export const LunaDog = {
    name: 'LunaDog',
    tokenId: '5a34d53ca483924b9a6aa0c771f11888881b516a8d1a9cdc535d063fe26d065e',
    decimals: 8
};
export const ergopad = {
    name: 'ergopad',
    tokenId: 'd71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413',
    decimals: 2
};
export const NETA = {
    name: 'NETA',
    tokenId: '472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8',
    decimals: 6
};
export const SigRSV = {
    name: 'SigRSV',
    tokenId: '003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0',
    decimals: 0
};
export const Erdoge = {
    name: 'Erdoge',
    tokenId: '36aba4b4a97b65be491cf9f5ca57b5408b0da8d0194f30ec8330d1e8946161c1',
    decimals: 0
};
export const SigUSD = {
    name: 'SigUSD',
    tokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
    decimals: 2
};
export const xyzpad = {
    name: 'xyzpad',
    tokenId: '29275cf36ffae29ed186df55ac6f8d47b367fe8e398721e200acb71bc32b10a0',
    decimals: 0
};

export const tokenInfosArray = [
    LunaDog,
    ergopad,
    NETA,
    SigRSV,
    SigUSD,
    Erdoge,
    xyzpad
]

export const tokenInfosById = tokenInfosArray.reduce((acc: any, cur) => {
    acc[cur.tokenId as string] = cur;
    return acc;
}, {})

export const tokenInfosByName = tokenInfosArray.reduce((acc: any, cur) => {
    acc[cur.name] = cur;
    return acc;
}, {})
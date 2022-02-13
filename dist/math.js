"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFractions = exports.math = void 0;
const mathjs_1 = require("mathjs");
exports.math = (0, mathjs_1.create)(mathjs_1.all, {
    epsilon: 1e-24,
    matrix: 'Matrix',
    number: 'BigNumber',
    precision: 64,
});
const renderFractions = (fractions, numDecimals) => {
    return exports.math.format(exports.math.evaluate(`${fractions} / 10^${numDecimals || 0}`), {
        notation: 'fixed',
        lowerExp: 1e-100,
        upperExp: 1e100,
    });
};
exports.renderFractions = renderFractions;
//# sourceMappingURL=math.js.map
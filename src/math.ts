import { all, create, MathJsStatic } from 'mathjs';

export const math = create(all, {
  epsilon: 1e-24,
  matrix: 'Matrix',
  number: 'BigNumber',
  precision: 64,
}) as Partial<MathJsStatic>;

export const renderFractions = (fractions: bigint | number | string, numDecimals?: number): string => {
  return math.format!(math.evaluate!(`${fractions} / 10^${numDecimals || 0}`), {
    notation: 'fixed',
    lowerExp: 1e-100,
    upperExp: 1e100,
  });
};

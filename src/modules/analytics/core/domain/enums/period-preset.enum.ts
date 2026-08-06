export enum PeriodPreset {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export function isValidPeriodPreset(value: string): value is PeriodPreset {
  return Object.values(PeriodPreset).includes(value as PeriodPreset);
}

import { PeriodPreset } from '../../domain/enums/period-preset.enum';

export interface DateRangeFilterDto {
  preset: PeriodPreset;
  /** Required together with endAt when preset is CUSTOM. */
  startAt?: Date;
  endAt?: Date;
}

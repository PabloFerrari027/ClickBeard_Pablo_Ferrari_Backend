import { Column, DataType, Model, Table } from 'sequelize-typescript';

import { AppointmentStatus } from '../../../core/domain/enums/appointment-status.enum';

export interface AppointmentModelAttributes {
  id: string;
  customerId: string;
  barberId: string;
  qualificationId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

/**
 * No association to `barbers`/`qualifications`/`users` — Scheduling
 * treats those as separate bounded contexts it only references by id
 * (see `BarberDirectory`). The real guard against double-booking is the
 * partial unique index on (barber_id, start_at) from the migration, not
 * anything declared here.
 */
@Table({ tableName: 'appointments', timestamps: false, underscored: true })
export class AppointmentModel extends Model<
  AppointmentModelAttributes,
  AppointmentModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare customerId: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare barberId: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare qualificationId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare startAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare endAt: Date;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentStatus)),
    allowNull: false,
    defaultValue: AppointmentStatus.SCHEDULED,
  })
  declare status: AppointmentStatus;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare cancelledAt: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare cancellationReason: string | null;
}

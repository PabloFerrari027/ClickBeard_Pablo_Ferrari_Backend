import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface BarberUnavailabilityModelAttributes {
  id: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  createdAt: Date;
}

/**
 * No association to `barbers` — mirrors `AppointmentModel`'s approach of
 * referencing other modules' tables only by id, never by Sequelize
 * association, to keep bounded contexts isolated at the infra layer too.
 */
@Table({
  tableName: 'barbers_unavailabilities',
  timestamps: false,
  underscored: true,
})
export class BarberUnavailabilityModel extends Model<
  BarberUnavailabilityModelAttributes,
  BarberUnavailabilityModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare barberId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare startAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare endAt: Date;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare reason: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
}

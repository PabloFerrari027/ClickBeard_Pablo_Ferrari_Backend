import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface BarberQualificationModelAttributes {
  barberId: string;
  qualificationId: string;
  createdAt: Date;
}

/** Join table backing `Barber.qualificationIds`; owned by this module. */
@Table({
  tableName: 'barbers_qualifications',
  timestamps: false,
  underscored: true,
})
export class BarberQualificationModel extends Model<
  BarberQualificationModelAttributes,
  BarberQualificationModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare barberId: string;

  @Column({ type: DataType.UUID, primaryKey: true })
  declare qualificationId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
}

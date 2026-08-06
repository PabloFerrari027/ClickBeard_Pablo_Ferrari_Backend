import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface BarberModelAttributes {
  id: string;
  name: string;
  age: number;
  hiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shares its primary key with the identity user it extends — see the
 * `create-barbers-table` migration. Deliberately has no association to
 * `users`: Barber and Identity are separate bounded contexts, and the
 * repository never needs to join through to the user row.
 */
@Table({ tableName: 'barbers', timestamps: false, underscored: true })
export class BarberModel extends Model<
  BarberModelAttributes,
  BarberModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare age: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare hiredAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
}

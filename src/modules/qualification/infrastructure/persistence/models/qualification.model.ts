import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface QualificationModelAttributes {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Table({ tableName: 'qualifications', timestamps: false, underscored: true })
export class QualificationModel extends Model<
  QualificationModelAttributes,
  QualificationModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
}

import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface VerificationCodeModelAttributes {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  invalidatedAt: Date | null;
  createdAt: Date;
}

@Table({
  tableName: 'verification_codes',
  timestamps: false,
  underscored: true,
})
export class VerificationCodeModel extends Model<
  VerificationCodeModelAttributes,
  VerificationCodeModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare codeHash: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare attempts: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare consumedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare invalidatedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
}

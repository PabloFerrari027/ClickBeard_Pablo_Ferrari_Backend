import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface RefreshTokenModelAttributes {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
}

@Table({ tableName: 'refresh_tokens', timestamps: false, underscored: true })
export class RefreshTokenModel extends Model<
  RefreshTokenModelAttributes,
  RefreshTokenModelAttributes
> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare tokenHash: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare revokedAt: Date | null;

  @Column({ type: DataType.UUID, allowNull: true })
  declare replacedByTokenId: string | null;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;
}

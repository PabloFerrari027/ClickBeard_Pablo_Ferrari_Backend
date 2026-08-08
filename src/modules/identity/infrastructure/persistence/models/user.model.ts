import { Column, DataType, Model, Table } from 'sequelize-typescript';

import { UserRole } from '../../../core/domain/enums/user-role.enum';

export interface UserModelAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  birthDate: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Timestamps are owned by the `User` entity (`touch()` sets them), not
 * by Sequelize, so this table opts out of automatic timestamp
 * management — the mapper always writes both from the domain object.
 */
@Table({ tableName: 'users', timestamps: false, underscored: true })
export class UserModel extends Model<UserModelAttributes, UserModelAttributes> {
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare passwordHash: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.CLIENT,
  })
  declare role: UserRole;

  @Column({ type: DataType.DATE, allowNull: true })
  declare birthDate: Date | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: Date;
}

import { randomUUID } from 'node:crypto';

import { AdminCannotBeDeactivatedError } from '../errors/admin-cannot-be-deactivated.error';
import { InvalidNameError } from '../errors/invalid-name.error';
import { SamePasswordError } from '../errors/same-password.error';
import { SameUserRoleError } from '../errors/same-user-role.error';
import { UserAlreadyActiveError } from '../errors/user-already-active.error';
import { UserAlreadyDeactivatedError } from '../errors/user-already-deactivated.error';
import { UserRole } from '../enums/user-role.enum';
import { BirthDate } from '../value-objects/birth-date.value-object';
import { Email } from '../value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';

const MIN_NAME_LENGTH = 2;

export interface UserProps {
  id: string;
  name: string;
  email: Email;
  password: Password;
  role: UserRole;
  birthDate?: BirthDate;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly id: string;
  private name: string;
  private email: Email;
  private password: Password;
  private role: UserRole;
  private birthDate?: BirthDate;
  private active: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.role = props.role;
    this.birthDate = props.birthDate;
    this.active = props.active;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    name: string;
    email: Email;
    password: Password;
    role?: UserRole;
    birthDate?: string | Date;
  }): User {
    const now = new Date();

    return new User({
      id: randomUUID(),
      name: User.validateName(props.name),
      email: props.email,
      password: props.password,
      role: props.role ?? UserRole.CLIENT,
      birthDate:
        props.birthDate !== undefined
          ? BirthDate.create(props.birthDate)
          : undefined,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: UserProps): User {
    return new User(props);
  }

  private static validateName(name: string): string {
    const trimmed = name.trim().replace(/\s+/g, ' ');

    if (trimmed.length < MIN_NAME_LENGTH) {
      throw new InvalidNameError();
    }

    return User.formatName(trimmed);
  }

  private static formatName(name: string): string {
    return name
      .split(' ')
      .map(
        (word) =>
          word.charAt(0).toLocaleUpperCase('pt-BR') +
          word.slice(1).toLocaleLowerCase('pt-BR'),
      )
      .join(' ');
  }

  changeName(newName: string): void {
    this.name = User.validateName(newName);
    this.touch();
  }

  changeBirthDate(newBirthDate: string | Date): void {
    this.birthDate = BirthDate.create(newBirthDate);
    this.touch();
  }

  changePassword(newPassword: Password): void {
    if (this.password.equals(newPassword)) {
      throw new SamePasswordError();
    }

    this.password = newPassword;
    this.touch();
  }

  changeRole(newRole: UserRole): void {
    if (this.role === newRole) {
      throw new SameUserRoleError();
    }

    this.role = newRole;
    this.touch();
  }

  deactivate(): void {
    if (this.role === UserRole.ADMIN) {
      throw new AdminCannotBeDeactivatedError();
    }

    if (!this.active) {
      throw new UserAlreadyDeactivatedError();
    }

    this.active = false;
    this.touch();
  }

  activate(): void {
    if (this.active) {
      throw new UserAlreadyActiveError();
    }

    this.active = true;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getPassword(): Password {
    return this.password;
  }

  getRole(): UserRole {
    return this.role;
  }

  getBirthDate(): BirthDate | undefined {
    return this.birthDate;
  }

  isActive(): boolean {
    return this.active;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

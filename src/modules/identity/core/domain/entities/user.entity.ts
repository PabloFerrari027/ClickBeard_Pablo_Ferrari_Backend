import { randomUUID } from 'node:crypto';

import { InvalidNameError } from '../errors/invalid-name.error';
import { SamePasswordError } from '../errors/same-password.error';
import { SameUserRoleError } from '../errors/same-user-role.error';
import { UserRole } from '../enums/user-role.enum';
import { Email } from '../value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';

const MIN_NAME_LENGTH = 2;

export interface UserProps {
  id: string;
  name: string;
  email: Email;
  password: Password;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly id: string;
  private name: string;
  private email: Email;
  private password: Password;
  private role: UserRole;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.role = props.role;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    name: string;
    email: Email;
    password: Password;
    role?: UserRole;
  }): User {
    const now = new Date();

    return new User({
      id: randomUUID(),
      name: User.validateName(props.name),
      email: props.email,
      password: props.password,
      role: props.role ?? UserRole.CLIENT,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: UserProps): User {
    return new User(props);
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();

    if (trimmed.length < MIN_NAME_LENGTH) {
      throw new InvalidNameError();
    }

    return trimmed;
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

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

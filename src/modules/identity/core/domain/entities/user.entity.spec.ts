import { AdminCannotBeDeactivatedError } from '../errors/admin-cannot-be-deactivated.error';
import { InvalidBirthDateError } from '../errors/invalid-birth-date.error';
import { InvalidNameError } from '../errors/invalid-name.error';
import { SamePasswordError } from '../errors/same-password.error';
import { SameUserRoleError } from '../errors/same-user-role.error';
import { UserAlreadyActiveError } from '../errors/user-already-active.error';
import { UserAlreadyDeactivatedError } from '../errors/user-already-deactivated.error';
import { UserRole } from '../enums/user-role.enum';
import { BirthDate } from '../value-objects/birth-date.value-object';
import { Email } from '../value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';
import { User, UserProps } from './user.entity';

function buildProps(overrides: Partial<UserProps> = {}): UserProps {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'fixed-id',
    name: 'John Doe',
    email: Email.create('john@example.com'),
    password: Password.fromHash('hashed-password'),
    role: UserRole.CLIENT,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('User', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('creates a user with default role CLIENT and active true', () => {
      const email = Email.create('new-user@example.com');
      const password = Password.fromHash('hashed-password');

      const user = User.create({ name: 'Jane Doe', email, password });

      expect(user.getName()).toBe('Jane Doe');
      expect(user.getEmail()).toBe(email);
      expect(user.getPassword()).toBe(password);
      expect(user.getRole()).toBe(UserRole.CLIENT);
      expect(user.isActive()).toBe(true);
      expect(user.getId()).toBeTruthy();
      expect(user.getCreatedAt()).toEqual(user.getUpdatedAt());
      expect(user.getBirthDate()).toBeUndefined();
    });

    it('creates a user with the given birth date when provided', () => {
      const user = User.create({
        name: 'Jane Doe',
        email: Email.create('jane@example.com'),
        password: Password.fromHash('hashed-password'),
        birthDate: '1995-05-20',
      });

      expect(user.getBirthDate()?.getValue()).toEqual(new Date('1995-05-20'));
    });

    it('throws InvalidBirthDateError for a birth date in the future', () => {
      expect(() =>
        User.create({
          name: 'Jane Doe',
          email: Email.create('jane@example.com'),
          password: Password.fromHash('hashed-password'),
          birthDate: '2999-01-01',
        }),
      ).toThrow(InvalidBirthDateError);
    });

    it('creates a user with the given role when provided', () => {
      const user = User.create({
        name: 'Admin User',
        email: Email.create('admin@example.com'),
        password: Password.fromHash('hashed-password'),
        role: UserRole.ADMIN,
      });

      expect(user.getRole()).toBe(UserRole.ADMIN);
    });

    it('trims the name before storing it', () => {
      const user = User.create({
        name: '  Jane Doe  ',
        email: Email.create('jane@example.com'),
        password: Password.fromHash('hashed-password'),
      });

      expect(user.getName()).toBe('Jane Doe');
    });

    it('throws InvalidNameError when the trimmed name is shorter than 2 characters', () => {
      expect(() =>
        User.create({
          name: ' J ',
          email: Email.create('jane@example.com'),
          password: Password.fromHash('hashed-password'),
        }),
      ).toThrow(InvalidNameError);
    });

    it('throws InvalidNameError for an empty name', () => {
      expect(() =>
        User.create({
          name: '   ',
          email: Email.create('jane@example.com'),
          password: Password.fromHash('hashed-password'),
        }),
      ).toThrow(InvalidNameError);
    });
  });

  describe('restore', () => {
    it('rebuilds a user from persisted props without transforming them', () => {
      const props = buildProps({ name: '  Untrimmed Name  ' });

      const user = User.restore(props);

      expect(user.getId()).toBe(props.id);
      expect(user.getName()).toBe('  Untrimmed Name  ');
      expect(user.getEmail()).toBe(props.email);
      expect(user.getPassword()).toBe(props.password);
      expect(user.getRole()).toBe(props.role);
      expect(user.isActive()).toBe(props.active);
      expect(user.getCreatedAt()).toBe(props.createdAt);
      expect(user.getUpdatedAt()).toBe(props.updatedAt);
    });
  });

  describe('changeName', () => {
    it('replaces the name and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const user = User.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      user.changeName('  New Name  ');

      expect(user.getName()).toBe('New Name');
      expect(user.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    });

    it('throws InvalidNameError when the trimmed name is shorter than 2 characters', () => {
      const user = User.restore(buildProps());

      expect(() => user.changeName(' J ')).toThrow(InvalidNameError);
    });
  });

  describe('changeBirthDate', () => {
    it('replaces the birth date and updates updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const user = User.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      user.changeBirthDate('1995-05-20');

      expect(user.getBirthDate()?.equals(BirthDate.create('1995-05-20'))).toBe(
        true,
      );
      expect(user.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    });

    it('throws InvalidBirthDateError for a birth date in the future', () => {
      const user = User.restore(buildProps());

      expect(() => user.changeBirthDate('2999-01-01')).toThrow(
        InvalidBirthDateError,
      );
    });
  });

  describe('changePassword', () => {
    it('replaces the password and updates updatedAt when the new password differs', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const user = User.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      const newPassword = Password.fromHash('new-hashed-password');
      user.changePassword(newPassword);

      expect(user.getPassword()).toBe(newPassword);
      expect(user.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    });

    it('throws SamePasswordError when the new password matches the current one', () => {
      const user = User.restore(buildProps());

      expect(() =>
        user.changePassword(Password.fromHash('hashed-password')),
      ).toThrow(SamePasswordError);
    });
  });

  describe('changeRole', () => {
    it('replaces the role and updates updatedAt when the new role differs', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const user = User.restore(buildProps({ role: UserRole.CLIENT }));

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      user.changeRole(UserRole.BARBER);

      expect(user.getRole()).toBe(UserRole.BARBER);
      expect(user.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    });

    it('throws SameUserRoleError when the new role matches the current one', () => {
      const user = User.restore(buildProps({ role: UserRole.CLIENT }));

      expect(() => user.changeRole(UserRole.CLIENT)).toThrow(SameUserRoleError);
    });
  });

  describe('deactivate', () => {
    it('sets active to false and updates updatedAt for a non-admin active user', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const user = User.restore(
        buildProps({ role: UserRole.CLIENT, active: true }),
      );

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      user.deactivate();

      expect(user.isActive()).toBe(false);
      expect(user.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    });

    it('throws AdminCannotBeDeactivatedError for an admin user', () => {
      const user = User.restore(
        buildProps({ role: UserRole.ADMIN, active: true }),
      );

      expect(() => user.deactivate()).toThrow(AdminCannotBeDeactivatedError);
    });

    it('throws UserAlreadyDeactivatedError when the user is already inactive', () => {
      const user = User.restore(
        buildProps({ role: UserRole.CLIENT, active: false }),
      );

      expect(() => user.deactivate()).toThrow(UserAlreadyDeactivatedError);
    });
  });

  describe('activate', () => {
    it('sets active to true and updates updatedAt for an inactive user', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const user = User.restore(buildProps({ active: false }));

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      user.activate();

      expect(user.isActive()).toBe(true);
      expect(user.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    });

    it('throws UserAlreadyActiveError when the user is already active', () => {
      const user = User.restore(buildProps({ active: true }));

      expect(() => user.activate()).toThrow(UserAlreadyActiveError);
    });
  });
});

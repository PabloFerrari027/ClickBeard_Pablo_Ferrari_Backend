import { InvalidQualificationNameError } from '../errors/invalid-qualification-name.error';
import { Qualification, QualificationProps } from './qualification.entity';

function buildProps(
  overrides: Partial<QualificationProps> = {},
): QualificationProps {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'fixed-id',
    name: 'Beard Trim',
    description: 'Trims and shapes beards',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Qualification', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('creates a qualification with a trimmed name and description', () => {
      const qualification = Qualification.create({
        name: '  Beard Trim  ',
        description: '  Trims and shapes beards  ',
      });

      expect(qualification.getName()).toBe('Beard Trim');
      expect(qualification.getDescription()).toBe('Trims and shapes beards');
      expect(qualification.getId()).toBeTruthy();
      expect(qualification.getCreatedAt()).toEqual(
        qualification.getUpdatedAt(),
      );
    });

    it('creates a qualification without a description when none is given', () => {
      const qualification = Qualification.create({ name: 'Haircut' });

      expect(qualification.getDescription()).toBeUndefined();
    });

    it('stores undefined description when it is only whitespace', () => {
      const qualification = Qualification.create({
        name: 'Haircut',
        description: '   ',
      });

      expect(qualification.getDescription()).toBeUndefined();
    });

    it('throws InvalidQualificationNameError when the trimmed name is shorter than 2 characters', () => {
      expect(() => Qualification.create({ name: ' A ' })).toThrow(
        InvalidQualificationNameError,
      );
    });
  });

  describe('restore', () => {
    it('rebuilds a qualification from persisted props without transforming them', () => {
      const props = buildProps({ name: '  Untrimmed  ' });

      const qualification = Qualification.restore(props);

      expect(qualification.getId()).toBe(props.id);
      expect(qualification.getName()).toBe('  Untrimmed  ');
      expect(qualification.getDescription()).toBe(props.description);
      expect(qualification.getCreatedAt()).toBe(props.createdAt);
      expect(qualification.getUpdatedAt()).toBe(props.updatedAt);
    });
  });

  describe('update', () => {
    it('updates the name and touches updatedAt when a new name is given', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const qualification = Qualification.restore(buildProps());

      jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
      qualification.update({ name: '  Fade Cut  ' });

      expect(qualification.getName()).toBe('Fade Cut');
      expect(qualification.getUpdatedAt()).toEqual(
        new Date('2026-01-02T00:00:00.000Z'),
      );
    });

    it('updates the description when a new description is given', () => {
      const qualification = Qualification.restore(buildProps());

      qualification.update({ description: '  New description  ' });

      expect(qualification.getDescription()).toBe('New description');
    });

    it('clears the description when given an empty string', () => {
      const qualification = Qualification.restore(buildProps());

      qualification.update({ description: '   ' });

      expect(qualification.getDescription()).toBeUndefined();
    });

    it('keeps the current name when no name is given', () => {
      const qualification = Qualification.restore(
        buildProps({ name: 'Haircut' }),
      );

      qualification.update({ description: 'Updated' });

      expect(qualification.getName()).toBe('Haircut');
    });

    it('keeps the current description when no description is given', () => {
      const qualification = Qualification.restore(
        buildProps({ description: 'Original' }),
      );

      qualification.update({ name: 'Updated Name' });

      expect(qualification.getDescription()).toBe('Original');
    });

    it('throws InvalidQualificationNameError when the new name is too short', () => {
      const qualification = Qualification.restore(buildProps());

      expect(() => qualification.update({ name: 'A' })).toThrow(
        InvalidQualificationNameError,
      );
    });
  });
});

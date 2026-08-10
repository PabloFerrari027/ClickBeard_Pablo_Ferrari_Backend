import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class BarberRoleChangeNotAllowedError extends ValidationError {
  constructor() {
    super(
      'The BARBER role cannot be assigned directly. Create a barber profile via POST /barbers instead.',
    );
  }
}

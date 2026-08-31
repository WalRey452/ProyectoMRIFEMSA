import { IsString, MinLength, Matches, Validate } from 'class-validator';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'MatchPasswords', async: false })
export class MatchPasswordsConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    return confirmPassword === object.newPassword;
  }
  defaultMessage(args: ValidationArguments) {
    return 'Las contraseñas no coinciden';
  }
}

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  currentPassword: string;

  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { 
    message: 'La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número o carácter especial' 
  })
  newPassword: string;

  @IsString({ message: 'La confirmación de la contraseña debe ser una cadena de texto' })
  @Validate(MatchPasswordsConstraint)
  confirmPassword: string;
}

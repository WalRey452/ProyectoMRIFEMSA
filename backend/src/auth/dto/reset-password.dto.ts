import { IsString, MinLength, Matches, Validate, IsNotEmpty } from 'class-validator';
import { MatchPasswordsConstraint } from './change-password.dto';

export class ResetPasswordDto {
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

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

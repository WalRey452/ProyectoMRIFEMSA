// ============================================================
// seed-admin.ts — Creación del primer usuario ADMIN
// Registro MRI v2.0 — NestJS + TypeORM + PostgreSQL
// ============================================================
// USO:
//   cd backend
//   npx ts-node src/seed-admin.ts
// O con la app corriendo (recomendado):
//   Ir a http://localhost:3000/api/docs  →  POST /auth/seed-admin
// ============================================================

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// ─── Conexión a PostgreSQL ────────────────────────────────
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'mri_user',
  password: process.env.DB_PASSWORD || 'MRI_SecurePass_2024!',
  database: process.env.DB_DATABASE || 'registro_mri',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// ─── Utilidades ───────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> =>
  new Promise(resolve => rl.question(q, resolve));

const askHidden = (q: string): Promise<string> =>
  new Promise(resolve => {
    process.stdout.write(q);
    process.stdin.setRawMode(true);
    let input = '';
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (char: string) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        input = input.slice(0, -1);
        process.stdout.write('\b \b');
      } else {
        input += char;
        process.stdout.write('*');
      }
    });
  });

const validatePassword = (pwd: string): string[] => {
  const errors: string[] = [];
  if (pwd.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(pwd)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(pwd)) errors.push('Al menos una minúscula');
  if (!/\d/.test(pwd)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) errors.push('Al menos un carácter especial');
  return errors;
};

// ─── Script principal ─────────────────────────────────────
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        REGISTRO MRI v2.0 — Creación de Administrador      ║
║        FEMSA Salud CSIRT                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Conectar a la base de datos
  console.log(`  Conectando a PostgreSQL (${process.env.DB_HOST || 'localhost'})...`);
  try {
    await dataSource.initialize();
    console.log('  ✅ Conexión exitosa\n');
  } catch (err: any) {
    console.error(`\n  ❌ Error de conexión: ${err.message}`);
    console.log('\n  ¿Está corriendo PostgreSQL?');
    console.log('  Si usas Docker: docker compose up -d postgres\n');
    process.exit(1);
  }

  // Verificar que la tabla users existe (el backend debe haber sincronizado)
  const tableExists = await dataSource.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    );
  `);

  if (!tableExists[0].exists) {
    console.error('\n  ❌ La tabla "users" no existe todavía.');
    console.log('  El backend NestJS debe ejecutarse al menos una vez para crear las tablas.');
    console.log('  Ejecuta: docker compose up backend\n');
    process.exit(1);
  }

  // Recopilar datos
  console.log('  Ingresa los datos del usuario ADMINISTRADOR:\n');
  const username = (await ask('  Usuario       : ')) || 'admin';
  const email = await ask('  Email         : ');
  const firstName = (await ask('  Nombre        : ')) || 'Admin';
  const lastName = (await ask('  Apellido      : ')) || 'MRI';
  const cargo = (await ask('  Cargo         : ')) || 'Líder CSIRT';

  console.log();
  let password = '';
  while (true) {
    password = await askHidden('  Contraseña    : ');
    const errors = validatePassword(password);
    if (errors.length > 0) {
      console.log(`  ⚠️  ${errors.join(' | ')}`);
      continue;
    }
    const confirm = await askHidden('  Confirmar     : ');
    if (password !== confirm) {
      console.log('  ❌ Las contraseñas no coinciden');
      continue;
    }
    break;
  }
  rl.close();

  // Verificar si el usuario ya existe
  const existing = await dataSource.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email],
  );

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  if (existing.length > 0) {
    // Actualizar contraseña y rol
    await dataSource.query(`
      UPDATE users 
      SET password_hash = $1, role = 'ADMIN', is_active = true,
          must_change_password = false, failed_login_attempts = 0,
          updated_at = $2
      WHERE username = $3 OR email = $4
    `, [passwordHash, now, username, email]);
    console.log(`\n  ✅ Usuario '${username}' actualizado con rol ADMIN.`);
  } else {
    // Crear nuevo usuario
    const id = uuidv4();
    await dataSource.query(`
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name,
        cargo, role, is_active, must_change_password,
        failed_login_attempts, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'ADMIN',true,false,0,$8,$9)
    `, [id, username, email, passwordHash, firstName, lastName, cargo, now, now]);

    // Guardar en historial de contraseñas
    await dataSource.query(`
      INSERT INTO password_history (id, user_id, password_hash, created_at)
      VALUES ($1,$2,$3,$4)
    `, [uuidv4(), id, passwordHash, now]);

    console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║  ✅  Administrador creado exitosamente                 ║
  ╠═══════════════════════════════════════════════════════╣
  ║  Usuario : ${username.padEnd(45)}║
  ║  Email   : ${email.padEnd(45)}║
  ║  Rol     : ADMIN                                      ║
  ╚═══════════════════════════════════════════════════════╝

  → Inicia sesión en: http://localhost:4200
    `);
  }

  await dataSource.destroy();
}

main().catch(err => {
  console.error('\n  ❌ Error inesperado:', err.message);
  process.exit(1);
});

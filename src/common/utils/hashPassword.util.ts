import * as bcrypt from 'bcrypt';

export async function hashPassword(
  plain: string,
  rounds: number = 10,
): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
) {
  return await bcrypt.compare(password, hashedPassword);
}

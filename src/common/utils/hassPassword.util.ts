import * as bcrypt from 'bcrypt';

export async function hashPassword(
  plain: string,
  rounds: number = 10,
): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

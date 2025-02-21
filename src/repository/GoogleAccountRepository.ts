import { GoogleAccountDB } from '../models/GoogleAccount';

export async function saveGoogleAccount(email: string, password: string) {
  return await GoogleAccountDB.create({
    email,
    password,
  });
}

export async function getAllGoogleAccounts() {
  return GoogleAccountDB.findAll({ raw: true });
}
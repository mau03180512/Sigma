import inquirer from 'inquirer';
import { loginWithEmail } from '../utils/auth.js';
import { printSuccessMessage, printErrorMessage } from '../utils/render.js';

export async function loginCommand(): Promise<void> {
  try {
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (v: string) => v.includes('@') ? true : 'Enter a valid email',
      },
    ]);

    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (v: string) => v.length >= 6 ? true : 'Password must be at least 6 characters',
      },
    ]);

    const creds = await loginWithEmail(email, password);
    printSuccessMessage(`Logged in as ${creds.email}`);
  } catch (error: any) {
    printErrorMessage(error.message);
    process.exit(1);
  }
}

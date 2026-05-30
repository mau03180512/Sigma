import { removeCredentials } from '../utils/config.js';
import { printSuccessMessage, printErrorMessage } from '../utils/render.js';

export async function logoutCommand(): Promise<void> {
  try {
    await removeCredentials();
    printSuccessMessage('Logged out and credentials removed.');
  } catch (error: any) {
    printErrorMessage(error.message);
    process.exit(1);
  }
}

import { loginWithBrowser } from '../utils/auth.js';
import { printSuccessMessage, printErrorMessage, printInfoMessage } from '../utils/render.js';

export async function loginCommand(): Promise<void> {
  try {
    if (process.env.SIGMA_GROQ_KEY) {
      printInfoMessage('SIGMA_GROQ_KEY is set — no login needed. Just use sigma-ai directly.');
      return;
    }
    printInfoMessage('Opening browser for Google sign-in...');
    const creds = await loginWithBrowser();
    printSuccessMessage(`Logged in as ${creds.email}`);
  } catch (error: any) {
    printErrorMessage(error.message);
    process.exit(1);
  }
}

/**
 * Preload for `next build` workers: inject existing local env files into
 * process.env. Never prints values. Never writes env files.
 */
import { loadDotEnvFiles } from "./playwright-env.mjs";

loadDotEnvFiles(process.env.ROVEXO_DOTENV_CWD || process.cwd());

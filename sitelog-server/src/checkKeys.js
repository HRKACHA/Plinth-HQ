import 'dotenv/config';
import { activeProvider } from './services/llmService.js';

console.log('--- Debugging Keys ---');
console.log('ANTHROPIC_API_KEY in process.env:', process.env.ANTHROPIC_API_KEY);
console.log('GEMINI_API_KEY in process.env:', process.env.GEMINI_API_KEY);
console.log('activeProvider detected as:', activeProvider);

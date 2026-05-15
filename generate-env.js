const fs = require('fs');
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';
fs.writeFileSync('src/env.ts', `export const env = {\n  SUPABASE_URL: '${url}',\n  SUPABASE_ANON_KEY: '${key}'\n};\n`);

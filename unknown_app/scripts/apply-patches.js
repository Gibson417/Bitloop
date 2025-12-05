const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', '@sveltejs', 'vite-plugin-svelte', 'src', 'utils', 'compile.js');

try {
  let code = fs.readFileSync(filePath, 'utf8');
  const marker = "compiled = svelte.compile(finalCode, { ...finalCompileOptions, filename });";
  if (code.includes("sanitizedOptions")) {
    console.log('Patch already applied.');
    process.exit(0);
  }

  if (!code.includes(marker)) {
    console.error('Expected marker not found; aborting patch.');
    process.exit(1);
  }

  const replacement = `// the svelte compiler does not recognize an \`hmr\` option; the plugin\n            // may use \`hmr\` internally for behavior but must not pass it to the\n            // compiler. Create a sanitized options object and remove \`hmr\` so\n            // the compiler doesn't throw \'Unrecognized option \'hmr\'\'.\n            const sanitizedOptions = { ...finalCompileOptions };\n            if ('hmr' in sanitizedOptions) delete sanitizedOptions.hmr;\n            compiled = svelte.compile(finalCode, { ...sanitizedOptions, filename });`;

  code = code.replace(marker, replacement);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Applied patch to @sveltejs/vite-plugin-svelte compile.js');
} catch (err) {
  console.error('Failed to apply patch:', err.message);
  process.exit(1);
}

# Publishing Guide for fhevm-rock-paper-scissors

This guide explains how to publish the SDK as an npm package.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm CLI**: Make sure you have npm installed (comes with Node.js)
3. **Login**: Run `npm login` to authenticate

## Pre-Publishing Checklist

- [x] Package name is unique (`fhevm-rock-paper-scissors`)
- [x] Version follows semver (currently `1.0.0`)
- [x] README.md is comprehensive
- [x] TypeScript builds successfully
- [x] All tests pass (19/19)
- [x] package.json has correct metadata
- [ ] Add LICENSE file (if not already present)

## Publishing Steps

### 1. Build the Package

```bash
cd sdk
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

### 2. Test Locally (Optional)

Test the package locally before publishing:

```bash
npm pack
```

This creates a `.tgz` file you can test in another project:

```bash
# In another project
npm install /path/to/fhevm-rock-paper-scissors-1.0.0.tgz
```

### 3. Publish to npm

```bash
# Dry run first to see what will be published
npm publish --dry-run

# If everything looks good, publish for real
npm publish --access public
```

**Note**: The `--access public` flag is required for scoped packages if you want them to be publicly available.

### 4. Verify Publication

After publishing, verify the package:

```bash
npm view fhevm-rock-paper-scissors
```

Or visit: https://www.npmjs.com/package/fhevm-rock-paper-scissors

## Versioning

For future updates, follow semantic versioning:

```bash
# Patch release (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# Minor release (new features, backwards compatible): 1.0.0 -> 1.1.0
npm version minor

# Major release (breaking changes): 1.0.0 -> 2.0.0
npm version major
```

Then publish again:

```bash
npm publish
```

## What Gets Published

The following files/directories are included (see `package.json` `files` field):

- `dist/` - Compiled JavaScript and type definitions
- `README.md` - Documentation
- `LICENSE` - License file
- `package.json` - Package metadata

The following are excluded (see `.npmignore`):

- `src/` - Source TypeScript files
- `test/` - Test files
- Development configuration files

## Package Structure

When users install your package, they'll get:

```
node_modules/
  fhevm-rock-paper-scissors/
    ├── dist/
    │   ├── index.js
    │   ├── index.d.ts
    │   └── src/
    │       ├── FHEJankenSDK.js
    │       ├── FHEJankenSDK.d.ts
    │       ├── types.js
    │       ├── types.d.ts
    │       └── utils.js
    │           utils.d.ts
    ├── package.json
    ├── README.md
    └── LICENSE
```

## Usage After Publishing

Users can install and use your package:

```bash
npm install fhevm-rock-paper-scissors
```

```typescript
import { FHEJankenSDK, Move, GameMode } from 'fhevm-rock-paper-scissors';
```

## Troubleshooting

### "Package name already exists"

If the package name is taken, you'll need to choose a different name or use a scoped package:

```json
{
  "name": "@your-username/fhevm-rock-paper-scissors"
}
```

### "You must be logged in to publish packages"

Run `npm login` and enter your npm credentials.

### "You do not have permission to publish"

Make sure you're logged in with the correct account that owns this package name.

## Continuous Integration (Optional)

Consider setting up automated publishing with GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/salman01zp/RPS-game/issues
- npm Package: https://www.npmjs.com/package/fhevm-rock-paper-scissors

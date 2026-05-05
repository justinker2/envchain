# envchain

Lightweight utility to chain and validate `.env` files across monorepo workspaces.

## Installation

```bash
npm install envchain
# or
pnpm add envchain
```

## Usage

```typescript
import { envchain } from 'envchain';

const env = envchain({
  files: ['.env', '.env.local', '.env.production'],
  required: ['DATABASE_URL', 'API_KEY'],
  workspace: 'packages/api',
});

env.validate(); // throws if required variables are missing
env.load();     // merges and loads variables into process.env
```

You can also chain across multiple workspaces:

```typescript
import { createChain } from 'envchain';

const chain = createChain()
  .add('../../.env')           // root
  .add('../../.env.local')     // root overrides
  .add('.env')                 // workspace
  .add('.env.local')           // workspace overrides
  .require('DATABASE_URL', 'PORT')
  .load();

console.log(chain.get('PORT')); // '3000'
```

### Options

| Option      | Type       | Description                                  |
|-------------|------------|----------------------------------------------|
| `files`     | `string[]` | Ordered list of `.env` files to chain        |
| `required`  | `string[]` | Variables that must be present after loading |
| `workspace` | `string`   | Base path for resolving files                |
| `strict`    | `boolean`  | Throw on missing or empty variables          |

## License

MIT
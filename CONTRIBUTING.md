# Contributing to Shardeum

Thank you for your interest in contributing to Shardeum! This guide covers the essentials for contributing to our EVM-based autoscaling blockchain platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Shardeum-Specific Development](#shardeum-specific-development)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Getting Started

**Prerequisites:**
- Node.js v18.19.1, npm v10.2.4, Rust v1.74.1
- Read [Code of Conduct](CODE_OF_CONDUCT.md)
- Check [existing issues](https://github.com/shardeum/shardeum/issues) and [PRs](https://github.com/shardeum/shardeum/pulls)

**Key Shardeum Concepts:**
- **Dynamic State Sharding**: Horizontal scaling through sharding
- **Shardus Protocol**: P2P networking layer
- **EVM Compatibility**: Full Ethereum Virtual Machine support
- **Consensus Groups**: Transaction validation mechanism

## Development Setup

**Environment Setup:**
> Follow [local-environment-setup.md](local-environment-setup.md) for detailed setup instructions.

**Quick Setup:**
```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/shardeum.git
cd shardeum

# 2. Install dependencies
npm ci
npm run prepare
npm install -g @shardeum-foundation/tools-shardus-cli

# 3. Configure environment
export LOAD_JSON_CONFIGS=$(pwd)/debug-10-nodes.config.json
```

## Shardeum-Specific Development

### Key Directories
```
src/
├── shardeum/           # Core Shardeum logic
│   ├── shardeumFlags.ts    # Feature flags
│   ├── shardeumTypes.ts    # Type definitions
│   └── shardeumConstants.ts # Constants
├── evm_v2/             # EVM implementation
├── tx/                 # Transaction processing
├── handlers/           # API endpoints
└── debug/              # Debug tools
```

### Important Configuration Files

**ShardeumFlags (`src/shardeum/shardeumFlags.ts`):**
```typescript
// Development flags
VerboseLogs: true,           // Enable detailed logging
debugTraceLogs: true,        // EVM execution traces
txBalancePreCheck: false,    // Skip balance checks for testing
StakingEnabled: false,       // Disable staking for local dev
UseDBForAccounts: true,      // Use SQLite for account storage
```

**Network Configuration:**
- `debug-10-nodes.config.json` - Local development (10 nodes)
- `debug-25-nodes.config.json` - Local development (25 nodes)
- `environments/*.config.json` - Network-specific configs

### Development Workflow

**Branch Strategy:**
- `main` - Production branch (protected)
- `dev` - Development branch (protected)
- Create feature branches from `dev`

**Local Development:**
```bash
# Start development
git checkout dev && git pull upstream dev
git checkout -b feature/your-feature

# Test locally
shardus start 10
# ... make changes and test ...
shardus stop && shardus clean

# Pre-commit checks
npm run lint && npm run format-check && npm test
```

### Shardeum-Specific Patterns

**Transaction Types:**
- EVM transactions (standard Ethereum)
- Internal transactions (staking, rewards, penalties)
- Debug transactions (testing only)

**Account Types:**
- EOA/Contract accounts
- Network accounts (global state)
- Node accounts (validator info)
- Receipt accounts (transaction logs)

**Debugging Tools:**
```bash
npm run dcr                           # Debug cycle records
node src/debug/replayTX.ts tx.json    # Replay transactions
npm run restart                       # Clean restart network
```

## Pull Request Guidelines

### Before Creating a PR
- [ ] Branch created from latest `dev`
- [ ] All tests pass: `npm test`
- [ ] Code formatted: `npm run format-check`
- [ ] Linting passes: `npm run lint`
- [ ] Local network tested: `shardus start 10`

### PR Requirements
- **Start as Draft** - Always create draft PRs first
- **Atomic commits** - Each commit represents one logical change
- **Test coverage** - Include tests for new features/fixes
- **Documentation** - Update docs if needed
- **Conventional commits** - Use format: `type(scope): description`

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**
```
feat(evm): add support for new opcode
fix(consensus): resolve race condition in validator selection
docs(contributing): update setup instructions
```

### Review Process
1. Create draft PR for early feedback
2. Mark ready when complete
3. Address all review comments
4. Maintainer approval required
5. Merge via rebase (maintainers only)

**Important Rules:**
- Never push directly to `main` or `dev`
- Use rebase, not merge
- Keep PRs focused (one feature/fix per PR)
- Regular rebase with `dev`: `git rebase upstream/dev`

## Testing

### Test Structure
- `test/unit/` - Unit tests for individual components
- `test/` - Integration and network tests
- Jest framework with TypeScript support
- 5-second timeout for network tests

### Running Tests
```bash
# All tests
npm test

# Specific test suites
npm run test:smoke          # 20 nodes smoke test
npm run test:shardedNet     # Sharded network test
npm run test:singleShardRotation  # Single shard rotation
npm run test:autoscaleNet   # Auto-scaling test

# Individual test files
npm test -- --testNamePattern="specific test"
```

### Writing Tests
- Place unit tests in `test/unit/src/` mirroring source structure
- Use `*.test.ts` or `*.spec.ts` naming
- Mock `src/index.ts` (see `test/unit/setup.ts`)
- Include tests for new features and bug fixes

### Manual Testing
```bash
# Start local network
shardus start 10

# Test your changes with transactions
# Check logs for errors

# Clean shutdown
shardus stop && shardus clean && rm -rf instances
```

### Coding Standards

**TypeScript:**
- Explicit return types required (ESLint enforced)
- Avoid `any` types
- Use interfaces for object shapes

**Prettier Configuration:**
```javascript
{
  singleQuote: true,
  trailingComma: 'es5',
  semi: false,
  printWidth: 120,
}
```

**Commands:**
- Format check: `npm run format-check`
- Format fix: `npm run format-fix`
- Lint: `npm run lint`

**Using `/* prettier-ignore */`:**
```typescript
// Only for long debug lines that should stay on one line
/* prettier-ignore */
if (ShardeumFlags.VerboseLogs) console.log('Long debug line', var1, var2, var3)
```

## Troubleshooting

### Common Setup Issues

**Node.js version mismatch:**
```bash
node --version  # Should be v18.19.1
nvm install 18.19.1 && nvm use 18.19.1
```

**Rust installation:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc --version  # Should be 1.74.1 or compatible
```

**npm ci fails:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Development Issues

**TypeScript compilation errors:**
```bash
npm run clean && npm run compile
```

**Network startup issues:**
```bash
# Clean previous instances
shardus stop && shardus clean && rm -rf instances/

# Check ports
lsof -i :9001-9010

# Start fresh
shardus start 10
```

**Test failures:**
```bash
# Ensure latest dev branch
git checkout dev && git pull upstream dev
npm ci && npm run prepare && npm test
```

### Performance Issues
- **Slow tests**: Use `npm run test:smoke` for faster feedback
- **High memory**: Reduce node count for local testing
- **Port conflicts**: Check `lsof -i :9001-9010`

### Getting Help
1. Check logs for error messages
2. Search [existing issues](https://github.com/shardeum/shardeum/issues)
3. Ask in [Discord](https://discord.com/invite/shardeum)
4. Create detailed issue with environment info

---

## Quick Reference

```bash
# Setup
git clone https://github.com/YOUR_USERNAME/shardeum.git
cd shardeum && git remote add upstream https://github.com/shardeum/shardeum.git
npm ci && npm run prepare
export LOAD_JSON_CONFIGS=$(pwd)/debug-10-nodes.config.json

# Development
git checkout dev && git pull upstream dev
git checkout -b feature/my-feature
npm run lint && npm run format-check && npm test
shardus start 10 && shardus stop && shardus clean

# Submit
git add . && git commit -m "feat: description"
git push origin feature/my-feature
# Create PR on GitHub
```

**Important Links:**
- [Issues](https://github.com/shardeum/shardeum/issues)
- [Discord](https://discord.com/invite/shardeum)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Local Setup Guide](local-environment-setup.md)

---

Thank you for contributing to Shardeum! 🚀

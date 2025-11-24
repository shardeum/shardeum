# Contributing to Shardeum

Thank you for your interest in contributing to Shardeum! We welcome contributions from the community and are excited to have you join us in building the future of scalable blockchain technology.

This guide will help you understand our development process and how to contribute effectively to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up Your Development Environment](#setting-up-your-development-environment)
  - [Running the Project Locally](#running-the-project-locally)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
- [Branch Organization](#branch-organization)
- [Pull Request Process](#pull-request-process)
  - [Before Submitting](#before-submitting)
  - [PR Guidelines](#pr-guidelines)
  - [Review Process](#review-process)
- [Coding Standards](#coding-standards)
  - [TypeScript Guidelines](#typescript-guidelines)
  - [Code Formatting](#code-formatting)
  - [Linting](#linting)
- [Testing Requirements](#testing-requirements)
  - [Writing Tests](#writing-tests)
  - [Running Tests](#running-tests)
  - [Test Coverage](#test-coverage)
- [Commit Guidelines](#commit-guidelines)
- [Documentation](#documentation)
- [Security](#security)
- [Community](#community)
- [License](#license)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.19.3 (exact version required)
- **npm**: v10.2.4 or higher
- **Rust**: v1.74.1
- **Git**: Latest version
- **Docker**: (Optional) For containerized development

> [!IMPORTANT]
> Shardeum requires specific versions of Node.js and Rust. Please refer to our [local environment setup guide](local-environment-setup.md) for detailed installation instructions.

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/shardeum.git
   cd shardeum
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/shardeum/shardeum.git
   ```

4. **Install dependencies**:
   ```bash
   npm ci
   ```

5. **Set up network configuration**:
   ```bash
   export LOAD_JSON_CONFIGS=/absolute/path/to/shardeum/debug-10-nodes.config.json
   ```

6. **Compile the project**:
   ```bash
   npm run prepare
   ```

7. **Install Shardus CLI** (for running local networks):
   ```bash
   npm install -g @shardeum-foundation/tools-shardus-cli
   npm update @shardeum-foundation/archiver
   ```

### Running the Project Locally

1. **Start a local network** with 10 nodes:
   ```bash
   shardus start 10
   ```

2. **Run the JSON-RPC server** (in a separate terminal):
   ```bash
   git clone https://github.com/shardeum/json-rpc-server.git
   cd json-rpc-server
   npm install
   npm run start
   ```

3. **Stop and clean up** when done:
   ```bash
   shardus stop && shardus clean && rm -rf instances
   ```

For more detailed setup instructions, see our [README.md](README.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs. actual behavior**
- **Environment details** (OS, Node version, etc.)
- **Relevant logs or screenshots**
- **Possible solutions** (if you have any ideas)

Use the bug report template when creating issues.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description** of the feature
- **Use cases** and why this enhancement would be useful
- **Possible implementation** approach (optional)
- **Alternative solutions** you've considered

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements

Feel free to ask questions in the issue comments or on our [Discord](https://discord.com/invite/shardeum).

## Branch Organization

This repository maintains a clean, linear Git history with the following structure:

### Long-Running Branches

- **`main`**: Production-ready code. Protected branch.
- **`dev`**: Development branch. All new features merge here first. Protected branch.

### Working with Branches

- ✅ **DO**: Create feature branches from `dev`
- ✅ **DO**: Use descriptive branch names (e.g., `feature/add-evm-support`, `fix/memory-leak`)
- ✅ **DO**: Keep branches focused on a single feature or fix
- ❌ **DON'T**: Submit PRs directly to `main`
- ❌ **DON'T**: Merge branches outside of PRs

### Keeping Your Branch Updated

Regularly sync your branch with `dev` using rebase:

```bash
git fetch upstream
git rebase upstream/dev
```

## Pull Request Process

### Before Submitting

1. **Ensure your code follows our coding standards** (see below)
2. **Run linting and formatting**:
   ```bash
   npm run lint
   npm run format-check
   ```
3. **Run all tests**:
   ```bash
   npm test
   ```
4. **Perform manual smoke testing** on your changes
5. **Update documentation** if needed
6. **Rebase and squash commits** (see commit guidelines)

### PR Guidelines

1. **Start as Draft**: Always create PRs in `Draft` state initially

2. **PR Title**: Use a clear, descriptive title following conventional commits format:
   - `feat: add new consensus mechanism`
   - `fix: resolve memory leak in transaction pool`
   - `docs: update API documentation`
   - `refactor: simplify state management logic`

3. **PR Description**: Include:
   - Summary of changes
   - Related issue numbers (e.g., `Fixes #123`)
   - Testing performed
   - Screenshots/videos (for UI changes)
   - Breaking changes (if any)

4. **Commits**: 
   - Keep commits atomic and logical
   - Squash commits before requesting review (prefer single commit per PR)
   - Multiple commits are acceptable if they represent logical steps

5. **Tests**:
   - Include unit tests for new features
   - Include integration tests where applicable
   - Ensure test coverage doesn't decrease
   - All tests must pass

6. **CI/CD**: All CI/CD pipelines must pass before merge

7. **Ready for Review**: 
   - Mark PR as "Ready for review" when complete
   - Request review from relevant maintainers
   - Respond to feedback promptly

### Review Process

- Maintainers will review your PR and may request changes
- Address feedback by pushing new commits
- Once approved, a maintainer will merge your PR
- PRs are typically merged using squash-and-merge

## Coding Standards

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Explicit return types**: All functions must have explicit return type annotations
  ```typescript
  // ✅ Good
  function calculateHash(data: string): string {
    return hash(data);
  }
  
  // ❌ Bad
  function calculateHash(data: string) {
    return hash(data);
  }
  ```
- **Avoid `any`**: Use specific types or `unknown` when type is truly unknown
- **Use interfaces** for object shapes
- **Prefer `const`** over `let` when variables won't be reassigned

### Code Formatting

We use **Prettier** with the following configuration:

```javascript
{
  singleQuote: true,
  trailingComma: 'es5',
  semi: false,
  printWidth: 120
}
```

**Format your code** before committing:
```bash
npm run format-fix
```

**Check formatting**:
```bash
npm run format-check
```

#### Using `/* prettier-ignore */`

Use sparingly to bypass formatting for specific lines:

**When to use:**
- Long debug lines that are more readable on a single line
- Special formatting that improves readability
- Temporary debugging code

**When NOT to use:**
- To avoid fixing formatting issues
- For regular production code
- As a workaround for code that should be refactored

**Example:**
```typescript
/* prettier-ignore */
if (ShardeumFlags.VerboseLogs) console.log('Lengths of blocks after pruning', Object.keys(blocksByHash).length, Object.keys(readableBlocks).length)
```

### Linting

We use **ESLint** with TypeScript, security, and XSS plugins.

**Run linter**:
```bash
npm run lint
```

**Key rules:**
- No empty blocks (except empty catch blocks)
- Explicit function return types required
- Security best practices enforced
- No unsanitized DOM manipulation

## Testing Requirements

### Writing Tests

- **Unit tests**: Test individual functions and modules
- **Integration tests**: Test component interactions
- **Smoke tests**: Test critical user flows

**Test file location**: Place tests in the `test/` directory, mirroring the `src/` structure.

**Test naming**: Use descriptive names that explain what is being tested:
```typescript
describe('TransactionPool', () => {
  it('should add valid transactions to the pool', () => {
    // test implementation
  });
  
  it('should reject transactions with invalid signatures', () => {
    // test implementation
  });
});
```

**Important**: `src/index.ts` is mocked for all tests. See `test/unit/setup.ts` for mock configuration. Avoid importing `index.ts` directly; import specific files instead.

### Running Tests

**Run all tests**:
```bash
npm test
```

**Run specific test suites**:
```bash
npm run test:smoke        # Smoke tests
npm run test:shardedNet   # Sharded network tests
```

**Run tests with coverage**:
```bash
npm test -- --coverage
```

### Test Coverage

- Aim for **80%+ code coverage** for new code
- Critical paths should have **100% coverage**
- PRs should not decrease overall coverage

## Commit Guidelines

We recommend using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(consensus): implement new consensus algorithm

fix(tx-pool): resolve memory leak in transaction validation

docs(readme): update installation instructions

test(evm): add tests for contract deployment
```

**Commit hygiene:**
- Commit frequently to your branch
- Rebase and squash before creating PR
- Each commit should be atomic and buildable
- Write clear, descriptive commit messages

## Documentation

Good documentation helps everyone! Please update documentation when:

- Adding new features
- Changing APIs or interfaces
- Modifying configuration options
- Fixing bugs that affect documented behavior

**Documentation locations:**
- Code comments: For complex logic
- README.md: For setup and usage
- `/docs`: For detailed guides
- JSDoc/TSDoc: For API documentation

## Security

Security is paramount for blockchain technology.

### Reporting Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead, please refer to our [SECURITY.md](SECURITY.md) file for instructions on how to report security issues responsibly.

### Security Best Practices

- Never commit secrets, private keys, or credentials
- Use the security linting rules (enabled by default)
- Validate and sanitize all external inputs
- Follow the principle of least privilege
- Be cautious with cryptographic operations

## Community

We're here to help! Connect with us:

- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/shardeum/shardeum/discussions)
- **Discord**: [Join our community](https://discord.com/invite/shardeum)
- **X (Twitter)**: [Follow @Shardeum](https://x.com/Shardeum)

### Getting Help

- Check existing documentation and issues first
- Ask questions in GitHub Discussions or Discord
- Be respectful and patient
- Provide context and details when asking for help

## License

By contributing to Shardeum, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Shardeum! Your efforts help build a more scalable and accessible blockchain future. 🚀

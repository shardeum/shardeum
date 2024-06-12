# Contribution Guide

Welcome to the Shardeum project! We're thrilled to have you here and appreciate your efforts to contribute. This guide will help you understand our project structure, coding standards, and processes to ensure smooth and effective collaboration.

## Table of Contents
1. [Branch Organization](#branch-organization)
2. [Pull Requests](#pull-requests)
3. [Coding Standards](#coding-standards)
4. [Commit Messages](#commit-messages)
5. [Testing Requirements](#testing-requirements)
6. [Setting Up Your Development Environment](#setting-up-your-development-environment)
7. [Using ESLint and Prettier](#using-eslint-and-prettier)
8. [Code of Conduct](#code-of-conduct)
9. [Getting Help](#getting-help)
10. [Continuous Integration and Deployment](#continuous-integration-and-deployment)
11. [Documentation Standards](#documentation-standards)
12. [Security Best Practices](#security-best-practices)

## Branch Organization

- This repo has two long-running branches: `main` and `dev`.
- Both branches are protected.
- All new branches must be based on or forked from the development branch `dev`.
- All branches submitted to the development branch must be tested.

We strive to maintain a clean, single, straight git history line.

## Pull Requests

- Always start PR creation with `Draft` state.
- Commits should be atomic.
- It's okay to commit and push frequently to your branch as long as the branch is rebased and commits are squashed before PR.
- It's okay to have multiple commits if logical. But must keep squashing to a single commit as much as possible for PR review efficiency.
- Use git commit conventions when adding messages to commits. [(Read Commit Convention Guide)](https://www.conventionalcommits.org/en/v1.0.0/)
- Ensure your code complies with formatting/linting configs set by the project.
- Branches must be tested at least with smoke tests manually.
- Must include test coverage.
- Must pass CI/CD pipelines.
- Regularly pull updates from the development branch `dev` using `--rebase`.
- Do not merge branches outside of a PR, use rebase.
- Do not submit to `main`.
- Undraft and request a review when ready.

## Coding Standards

- We use Google TypeScript Prettier settings for most of our formatting.
- `/*prettier-ignore*/` is often used to bypass really long debug code lines. This is a tip, not an instruction.
- Do not abuse `/*prettier-ignore*/`.

## Commit Messages

Good commit messages help reviewers understand the context and history of changes. Follow these guidelines:
- Use imperative mood in the subject line (e.g., "Fix bug" not "Fixed bug" or "Fixes bug").
- Limit the subject line to 50 characters.
- Wrap the body at 72 characters.
- Include references to issues or PRs when applicable.

## Testing Requirements

- Include test coverage for all new features and bug fixes.
- Run all existing tests to ensure nothing is broken by your changes.
- Manual smoke tests should be performed before submitting PRs.
- Ensure all changes pass CI/CD pipelines.

## Setting Up Your Development Environment

### Prerequisites

- Node.js (version 18.16.1)
- npm (version 9.5.1)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/shardeum/shardeum.git
    cd shardeum
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Setup Environment Variables**:
    Copy the `.env_example` to `.env` and customize the settings as needed.
    ```bash
    cp .env_example .env
    ```

### Node.js and NVM

Shardeum requires a specific version of Node.js (18.16.1) and npm (9.5.1). Use the Node Version Manager (NVM) to manage multiple versions of Node.js:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18.16.1
nvm use 18.16.1
```

### Rust Toolchain

Some networking code is implemented in Rust. Install Rust as follows:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup install 1.74.1
rustup default 1.74.1
```

### Build Essentials

Install necessary build tools:
- For Linux:
    ```bash
    sudo apt-get install build-essential
    ```
- For MacOS:
    ```bash
    brew install gcc
    ```

### Node-gyp

Install node-gyp globally and configure Python:
```bash
npm i -g node-gyp
npm config set python `which python3`
npm config list
```

## Using ESLint and Prettier

Ensure consistent code style using ESLint and Prettier. We use the following configuration:
- **ESLint**: For JavaScript and TypeScript linting.
- **Prettier**: For code formatting.

### Install ESLint and Prettier

1. **Add ESLint to the project**:
    ```bash
    npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev
    ```

2. **Create or update `.eslintrc.json`**:
    ```json
    {
      "parser": "@typescript-eslint/parser",
      "plugins": ["@typescript-eslint"],
      "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      "rules": {
        "indent": ["error", 4],
        "@typescript-eslint/indent": ["error", 4]
      }
    }
    ```

3. **Install Prettier and configure**:
    ```bash
    npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev
    ```

4. **Create or update `.prettierrc`**:
    ```json
    {
      "singleQuote": true,
      "semi": false,
      "tabWidth": 4,
      "useTabs": false
    }
    ```

5. **Install ESLint extension for VS Code** for linting and auto-fixing on save.

## Continuous Integration and Deployment

We use GitLab CI/CD for continuous integration and deployment. Ensure your code passes all stages in the `.gitlab-ci.yml` file:

### Stages
- **build**: Compiles the code.
- **appsec**: Runs application security checks.
- **lint**: Runs ESLint to ensure code quality.

### Example `.gitlab-ci.yml`
```yaml
include:
  - remote: 'https://gitlab.com/pod_security/shared-ci/-/raw/main/security.yml'
  
image: 'registry.gitlab.com/shardus/dev-container:latest_node18'

before_script:
  - node -v

stages:
  - build
  - appsec
  - lint

build-job:
  cache:
    paths:
      - node_modules/
  stage: build
  script:
    - echo "Compiling the code..."
    - npm install --silent
    - npm run compile
    - echo "Compile complete."

lint-job:
  cache:
    paths:
      - node_modules/
  stage: lint
  script:
    - echo "Running ESlint..."
    - npm install @typescript-eslint/eslint-plugin@5.48.0 --save-dev
    - npm run lint
    - echo "Running ESlint complete."
```

## Documentation Standards

Clear and comprehensive documentation is crucial. Follow these guidelines:
- Use Markdown for documentation.
- Write clear, concise, and descriptive comments.
- Document all functions and modules.
- Ensure README and other documentation files are up-to-date with the latest changes.

## Security Best Practices

Security is paramount. Follow these best practices:
- Use the `security` and `no-unsanitized` ESLint plugins.
- Regularly update dependencies to avoid vulnerabilities.
- Never hardcode sensitive information like passwords or API keys.
- Use environment variables for configuration.

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to understand the expectations we have for everyone contributing to this project.

## Getting Help

For any questions or support, reach out to us at:
- Email: support@shardeum.org
- Twitter: [@Shardeum](https://twitter.com/Shardeum)
- Discord: [Join our community](https://discord.com/invite/shardeum)

---

This comprehensive guide aims to make your contribution experience as smooth and productive as possible. Happy coding and thank you for your contributions!

---

**Key Additions and Insights from Codebase:**

1. **Use of Specific Rust Version:**
   Ensure to use Rust version 1.74.1 for compatibility with the networking code.
   ```bash
   rustup install 1.74.1
   rustup default 1.74.1
   ```

2. **Debug Mode Configuration:**
   For local development,

 enable debug mode in `src/config/index.ts`:
   ```typescript
   // src/config/index.ts
   forceBogonFilteringOn: false,
   mode: 'debug'
   ```

3. **Debug Flag Adjustments:**
   Adjust debug flags in `src/shardeum/shardeumFlags.ts` for local testing:
   ```typescript
   // src/shardeum/shardeumFlags.ts
   txBalancePreCheck: false,
   StakingEnabled: false,
   ```

4. **Cycle Duration and Block Production Rate:**
   Modify cycle duration and block production rate for efficient local testing:
   ```typescript
   // src/config/index.ts
   cycleDuration: 30,
   
   // src/shardeum/shardeumFlags.ts
   blockProductionRate: 3,
   ```

5. **ESLint and Prettier Configuration:**
   Ensure consistent formatting with ESLint and Prettier using Google TypeScript settings. Avoid overuse of `/* prettier-ignore */` directive, and use it only for long debug lines or special formatting needs.

# Contribution Guide

Welcome to the Shardeum contribution guide! This document provides the essential information needed to contribute effectively to our repository. Whether you're fixing a bug, adding a new feature, or improving documentation, following these guidelines will streamline the process and ensure smooth collaboration. Please read this guide carefully before contributing.

---

## Branch Organization

- **Branching Strategy:**
  - The repository uses two primary branches:
    - `main` for stable releases.
    - `dev` for ongoing development.
  - Both branches are **protected** to prevent direct commits. All changes must be introduced via pull requests.

- **New Branch Creation:**
  - Always base new branches on the `dev` branch to ensure features are built on the most recent development work.

- **Testing Requirement:**
  - All changes must be thoroughly tested before submission. This includes:
    - Unit tests.
    - Integration tests.
    - Manual checks, as necessary.

- **Repository History:**
  - Keep the repository history clean and linear by using **rebase** and **squash** strategies effectively.

---

## Pull Request Guidelines

1. **Draft Stage:**
   - Begin each pull request (PR) in the `Draft` state to allow for incremental changes and early feedback.

2. **Commit Best Practices:**
   - Use **atomic commits**: Each commit should represent a single logical change.
   - Commit frequently to track progress and facilitate collaboration.

3. **Rebase and Squash:**
   - Before moving a PR out of the draft stage:
     - Rebase your branch onto the latest `dev` branch.
     - Squash commits to streamline the history. Multiple commits can remain if they represent logical steps.

4. **Code Compliance:**
   - Ensure your code adheres to the project’s formatting and linting guidelines.

5. **Testing:**
   - Include test coverage and ensure your branch passes all required tests and CI/CD pipelines.

6. **Branch Updates:**
   - Regularly update your branch with the latest changes from `dev` using `--rebase` to avoid conflicts.

7. **Integration Guidelines:**
   - Use **rebase** instead of merge to integrate changes from `dev` and maintain a clean history.
   - Direct submissions to the `main` branch are **prohibited**. All changes must go through `dev` first.

8. **PR Reviews:**
   - Once your PR is ready, undraft it and request reviews.
   - Be receptive to feedback and make necessary adjustments promptly.

---

## Standardized Formatting Guidelines

To ensure code consistency and maintainability, all contributors must adhere to the following formatting standards:

1. **Prettier Configuration:**
   - Use **Google TypeScript Prettier settings** to ensure a uniform style for all TypeScript files.

2. **Minimal Use of Prettier Ignores:**
   - Use `/* prettier-ignore */` sparingly to avoid inconsistent code styles across the project.

3. **Linting:**
   - Run the project's linter before submitting a pull request.
   - Ensure your code complies with all linting rules defined in the project configuration.

4. **Code Readability:**
   - Write clear, readable code:
     - Use meaningful variable and function names.
     - Include comments where necessary to explain the purpose of code blocks.

5. **Project Conventions:**
   - Adhere to additional formatting and coding standards documented in the repository.

6. **Commit Messages:**
   - Follow a conventional commit message format for clarity and consistency. Refer to the [Commit Convention Guide](https://www.conventionalcommits.org/en/v1.0.0/).

---

## Additional Guidelines

- **Coding Standards:**
  - Follow the project's coding standards or style guide wherever possible.

- **Testing:**
  - Ensure all tests pass before submission, and provide adequate test coverage for your changes.

- **Documentation:**
  - Update documentation if your changes introduce new features or modify existing functionality.

- **Community & Review Process:**
  - Be respectful and receptive to feedback during the review process.
  - Make necessary adjustments promptly based on reviewer suggestions.

---

## Summary

By following this guide, you'll help ensure a smooth and efficient contribution process while maintaining the quality and consistency of the repository. Thank you for contributing to Shardeum!
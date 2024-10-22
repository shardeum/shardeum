# Contribution guide

Welcome to the Shardeum contribution guide! This guide provides the essential information you need to contribute effectively to our repository. Whether you're fixing a bug, adding a new feature, or improving documentation, following these guidelines will streamline the process and ensure smooth collaboration. Please read through this guide carefully before starting your contribution.

# Branch Organization



- Maintain two primary branches: `main` for stable releases and `dev` for ongoing development.
- Both branches are protected to prevent direct commits; all changes must come through pull requests.
- Always base new branches on the `dev` branch to ensure that features are built on the most recent development work.
- Ensure that all changes intended for the `dev` branch are thoroughly tested before submission. This includes unit tests, integration tests, and manual checks as necessary.

Ensure this repo is kept clean and linear repository history by using rebase and squash strategies effectively.






## Pull Request Guidelines

- **Initiate with Draft:** Begin every pull request in the `Draft` state to allow for incremental changes and feedback.
- **Atomic Commits:** Ensure each commit is self-contained and represents a single logical change.
- **Frequent Commits:** It's encouraged to commit and push changes to your branch frequently. This helps in keeping track of progress and facilitates easier collaboration.
- **Rebase and Squash:** Before moving a PR out of draft, rebase your branch onto the latest `dev` branch and squash your commits to streamline the history.
- **Logical Multiple Commits:** If multiple commits in a PR make logical sense, they can be kept, but strive to squash them into as few commits as possible to maintain clarity during reviews.
- **Code Compliance:** Ensure your code adheres to the project’s formatting and linting guidelines.
- **Testing:** Include test coverage and ensure your branch passes all required tests and CI/CD pipelines.
- **Regular Updates:** Regularly update your branch with the latest changes from the `dev` branch using `--rebase` to avoid conflicts.
- **Use Rebase, Avoid Merge:** Always use rebase instead of merge to integrate changes from `dev` to keep the history clean.
- **Review and Undraft:** Once your PR is complete, undraft it and request reviews to proceed with merging.

## Standardized Formatting Guidelines

To ensure consistency and maintainability of the codebase, all contributors are required to adhere to the following formatting guidelines:

1. **Prettier Configuration:** Use the Google TypeScript Prettier settings. This helps in maintaining a uniform style for all TypeScript files.
2. **Avoid Overusing Prettier Ignores:** While `/*prettier-ignore*/` can be used to bypass formatting for specific lines, it should be used sparingly. Excessive use can lead to inconsistent code styles across the project.
3. **Linting:** Always run the project's linter before submitting a pull request. Ensure that your code complies with all linting rules set in the project configuration.
4. **Code Readability:** Write clear and readable code. Use meaningful variable and function names and include comments where necessary to describe the purpose of the code blocks.
5. **Follow Project Conventions:** Adhere to any additional formatting and coding standards that are documented in the project repository.
6. **Commit Messages:** Follow a conventional commit message format for clarity and consistency, though it's not mandatory. [Commit Convention Guide](https://www.conventionalcommits.org/en/v1.0.0/)


# Additional Guidelines
* **Coding Standards:** Follow our standards or style guide as much as possible.
* **Testing:** Ensure your branch passes all required tests and CI/CD pipelines.
* **Documentation:** If you are adding a new feature, update the documentation accordingly.
* **Community & Review Process:** Be respectful and receptive to feedback during the review process & make necessary adjustments accordingly.

## Using `/* prettier-ignore */`

### What is `/* prettier-ignore */`?

`/* prettier-ignore */` is a directive used in Prettier to prevent the code formatter from formatting a specific piece of code. This can be useful when you have lines of code that should remain unchanged for readability, debugging, or other specific reasons.

### When to Use `/* prettier-ignore */`

There are a few common scenarios where you might want to use `/* prettier-ignore */`:

1. **Long Debug Lines**: When you have long lines of code for debugging purposes that you want to keep on a single line for easier readability.
2. **Special Formatting**: When you have specific formatting that you want to maintain that Prettier would otherwise change.
3. **Temporary Code**: When you have temporary code that is meant for testing and you don’t want it to be auto-formatted.

### How to Use `/* prettier-ignore */`

To use `/* prettier-ignore */`, simply place the comment on the line before the code you want to ignore. Here is an example:

#### Example

```javascript
/* prettier-ignore */
if (ShardeumFlags.VerboseLogs) console.log('Lengths of blocks after pruning', Object.keys(blocksByHash).length, Object.keys(readableBlocks).length)
```

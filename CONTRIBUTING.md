# Contributing Guidelines

Thank you for your interest in contributing! This project uses a typical GitHub workflow and enforces consistent coding standards.

## Workflow

1. **Fork & clone** the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and add any required secrets.
4. Create a new branch for your change.
5. Make your changes and ensure `npm run lint` passes.
6. Commit using the format described below.
7. Push your branch and open a pull request against `main`.

## Code Style

- All code is written in **TypeScript** and **React**.
- Linting is provided by ESLint; run `npm run lint` before committing.
- Use the existing folder structure under `src/` (components, hooks, services, integrations, pages).
- Avoid debugging statements in committed code (`console.log`).
- Keep components small and reuse hooks/utilities to stay DRY.

Formatting is handled by the project's ESLint/Prettier setup. Configure your editor to auto-format on save.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Example types include:

- `feat`: a new feature
- `fix`: a bug fix
- `docs`: documentation changes
- `chore`: maintenance tasks

Use the following structure:

```
type(scope): brief description

[optional body]
```

Example:

```
feat(auth): add OAuth login flow
```

## Pull Requests

- Ensure your PR description explains **why** the change is needed.
- Keep PRs focused and minimal.
- Passing `npm run lint` is required before merging.

Happy coding!

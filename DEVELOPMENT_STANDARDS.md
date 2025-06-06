# Development Standards

This document outlines the conventions every contributor (AI or human) should follow to keep the codebase consistent and maintainable.

## General Workflow

1. **Install dependencies** using `npm install` before starting work.
2. Use `npm run dev` for local development and `npm run build` to produce optimized builds.
3. Run `npm run lint` before committing to ensure code passes ESLint checks.
4. Prefer creating small, focused pull requests with clear descriptions.

## Coding Style

- **Language**: TypeScript is required for all source files.
- **Indentation**: Use two spaces; avoid tabs.
- **Quoting**: Use double quotes for strings and imports.
- **Semicolons**: Keep semicolons at the end of statements.
- **Imports**: Use the `@/` alias for paths under `src/`.
- **Formatting**: Run [Prettier](https://prettier.io/) with the default settings (`npx prettier --write .`) to auto-format files.

## React Guidelines

- Use functional components and React hooks.
- Keep component files focused: one component per file when possible.
- Co-locate component styles using Tailwind CSS utility classes.

## Version Control

- Write concise commit messages in the imperative mood (e.g. "Add login form").
- Limit the subject line to ~72 characters and include additional details in the body if needed.
- Do not commit `.env` files or other secrets.

## Directory Structure

```
src/
  components/   # Reusable UI components
  contexts/     # React context providers
  hooks/        # Custom React hooks
  pages/        # Route-level pages
  utils/        # General utility modules
```

Keep new files grouped by purpose following this layout.

## Review Checklist

Before submitting a pull request, verify the following:

- [ ] `npm run lint` passes with no errors or warnings.
- [ ] Code is formatted with Prettier.
- [ ] New functionality includes appropriate TypeScript types.
- [ ] Commit messages clearly describe the change.

Following these standards helps every contributor keep the project clean and approachable.

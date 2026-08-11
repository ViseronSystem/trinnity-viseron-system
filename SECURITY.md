# Security Policy

## Secret Handling

- **Environment variables**: All secrets stored in `.env` (gitignored)
- **API keys**: Never committed to repository
- **Credentials**: Never in source code, logs, or documentation
- **Private keys**: Excluded from snapshots automatically

## Reporting Vulnerabilities

Report security issues to the project maintainers directly. Do NOT open public issues for security vulnerabilities.

## Snapshot Security

The Recovery & Migration System automatically excludes:
- `.env` files
- `*keypair*.json` files
- `*-seed*.txt` files
- Files matching credential patterns

## Development Guidelines

- Never commit real API keys, tokens, or credentials
- Use environment variables for all secrets
- Verify no secrets in `git diff` before committing
- Snapshots exclude secret files by default

## Production Deployment

- Rotate all keys when migrating to new server
- Verify `.env` permissions (chmod 600)
- Run environment validation before starting
- Confirm SHA-256 integrity after restore

## Responsible Disclosure

If you discover a security vulnerability, please contact the maintainers privately. We will respond within 72 hours.

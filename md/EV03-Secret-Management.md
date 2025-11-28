### **EV03-Secret-Management.md**

## Overview

Create a comprehensive secret management system for our SvelteKit project. This involves establishing security best practices, creating a suite of developer scripts for handling secrets, and ensuring a secure workflow for team collaboration and deployment. This system must prevent credential exposure while integrating seamlessly with our existing environment validation and CI/CD pipelines.

---

## Requirements

### Security Requirements
- **Secret Isolation**: Strictly separate secrets for development, testing, and production environments.
- **Access Control**: Implement role-based access control (RBAC) principles for production secrets, with audit logging for all operations.
- **Encryption**: Ensure all secrets are encrypted at rest and in transit using industry-standard protocols (AES-256, TLS 1.3).
- **Rotation**: Establish clear procedures for automated and manual secret rotation with zero downtime.
- **Monitoring**: Implement detection for secret exposure, unauthorized access attempts, and rotation failures.

### Environment Security
- **Development**: Utilize local `.env` files, which must be git-ignored. Promote secure team sharing via a dedicated secret manager like 1Password or Bitwarden.
- **Production**: Use a dedicated secret management service (e.g., AWS Secrets Manager, HashiCorp Vault, Cloudflare Secrets). Secrets must be injected at runtime, never stored in container images or committed to version control.

---

## Developer Tooling & Scripts 🛠️

This is the core implementation task. Create a suite of command-line utilities to manage secrets throughout the development lifecycle.

- **Technology**: All scripts **must be written in TypeScript** and executed directly using a modern runtime like **`tsx`**. This avoids a separate, cumbersome build step for tooling and aligns with our project's SvelteKit/Vite ESM-first approach.
- **Integration**: The scripts should be added to the `scripts` section of `package.json` for easy team access.
- **Required Scripts**:
    1.  `secrets:generate`: An interactive script to generate new, cryptographically secure secrets (e.g., JWT keys, database passwords) based on predefined strength requirements.
    2.  `secrets:validate`: A script that builds upon our existing environment validation to check secrets in `.env` files for format, strength, and entropy.
    3.  `secrets:detect`: A script that scans staged files for accidentally committed secrets (e.g., strings matching API key patterns). This will be used in a pre-commit hook.

---

## Technical Specifications

### Implementation Requirements
- **Pre-commit Hooks**: Use a tool like **Husky** to set up a pre-commit hook that automatically runs the `secrets:detect` script to prevent accidental secret commits.
- **CI/CD Integration**: The `secrets:detect` and `secrets:validate` scripts must be run as checks in the CI/CD pipeline (GitHub Actions) on every push and pull request.
- **Audit Logging**: For production secrets, ensure the chosen cloud service provides tamper-proof audit logs for all secret access, rotation, and modification events.
- **Performance**: Secret retrieval in production must not add significant latency (target < 100ms) to application startup time.

### Secret Categories & Standards
- **Categories**: Database credentials, API keys (OpenAI, Stripe), JWT secrets, OAuth credentials.
- **Strength Minimums**:
    - JWT Secrets: 32+ characters, high entropy.
    - Database Passwords: 16+ characters, mixed case, numbers, symbols.
    - API Keys: Conform to provider standards.
- **Naming**: Use consistent naming conventions as defined in `EV01-Env-File-Setup.md`.

---

## Additional Context for AI Assistant

This feature builds directly upon our existing environment variable foundation. The key implementation detail is to **leverage `tsx` to create a seamless developer experience for running TypeScript-based helper scripts without a build step**.

The scripts must integrate with the Docker Compose infrastructure and prepare for all current and future API integrations (OpenAI, Strapi, Better Auth, Stripe, etc.). The overall approach must scale from a solo developer's local machine to a production deployment with multiple team members, aligning with our CI/CD and security posture.
# Security policy

## Supported code

Security fixes are maintained on the `main` branch. Before reporting an issue, confirm that it still affects the latest commit on `main`.

## Reporting a vulnerability

Do not disclose suspected vulnerabilities, credentials, exploit details, or affected user data in a public issue.

Use the repository's **Security** tab and select **Report a vulnerability** to open a private security advisory. If private reporting is unavailable, open a public issue containing no sensitive technical details and ask the repository owner to establish a private contact channel.

Include, when possible:

- the affected file, route, or component;
- the security impact and required attacker access;
- minimal reproduction steps using non-production data;
- the tested commit SHA and runtime version;
- suggested mitigations, if known.

Never include live API keys, upload credentials, user content, or other secrets in a report. Revoke and rotate any credential that may have been exposed.

## Deployment security

Review `.env.example` and `docs/SECURITY_CONFIGURATION.md` before deployment. In particular, every deployed environment must configure a unique, random `UPLOAD_PROXY_TICKET_SECRET` containing at least 32 characters.

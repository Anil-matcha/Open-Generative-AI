# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

We take the security of Marketing Agent seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not:
- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please Do:
1. **Email us privately** with details of the vulnerability
2. Include steps to reproduce the issue
3. Provide any relevant logs or screenshots
4. Give us reasonable time to address the issue before public disclosure

### What to Include:
- Type of vulnerability (e.g., injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability

### Response Timeline:
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

## Security Best Practices

When using Marketing Agent:

### API Keys
- **Never commit** `api_secrets.py` to version control
- Use environment variables for production deployments
- Rotate API keys regularly
- Use separate keys for development and production

### Web Scraping
- Respect `robots.txt` files
- Implement rate limiting
- Don't scrape sensitive or private websites
- Be aware of legal implications in your jurisdiction

### Generated Assets
- Review generated content before publishing
- Don't use for malicious purposes
- Respect copyright and trademark laws
- Verify brand permissions before using logos

### Dependencies
- Keep dependencies updated
- Review security advisories for:
  - `playwright`
  - `aiohttp`
  - `httpx`
  - `Pillow`
  - Other dependencies

### Data Privacy
- Don't process sensitive personal data
- Be aware of GDPR/CCPA requirements
- Don't store scraped data longer than necessary
- Implement proper data retention policies

## Known Security Considerations

### Current Limitations:
1. **API Keys in Files**: Currently uses file-based API key storage
   - Recommendation: Use environment variables in production

2. **Web Scraping**: May access any URL provided
   - Recommendation: Implement URL allowlisting for production

3. **Generated Content**: No content filtering
   - Recommendation: Review all generated content before use

4. **File Uploads**: Uses third-party service (fal.ai)
   - Recommendation: Review their security policies

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 2.0.1)
- Documented in [CHANGELOG.md](CHANGELOG.md)
- Announced in GitHub releases
- Tagged with `security` label

## Acknowledgments

We appreciate security researchers who:
- Report vulnerabilities responsibly
- Give us time to fix issues
- Help make Marketing Agent more secure

Thank you for helping keep Marketing Agent and its users safe!

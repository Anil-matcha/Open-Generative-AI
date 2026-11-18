/**
 * Accessibility audit helper — logs common a11y issues found during manual review.
 * Run in browser console: `a11yAudit.report()`
 *
 * This is a lightweight runtime checker that complements axe-core.
 * For full automated testing, use @axe-core/react or axe DevTools browser extension.
 */
const a11yAudit = {
  issues: [],

  /** Check for images without alt text */
  checkImages() {
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      this.issues.push({
        type: 'missing-alt',
        severity: 'high',
        count: images.length,
        message: `${images.length} images missing alt attribute`,
        elements: [...images].slice(0, 5).map(el => el.outerHTML.substring(0, 100)),
      });
    }
  },

  /** Check for buttons without accessible names */
  checkButtons() {
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const unnamed = [...buttons].filter(btn => !btn.textContent.trim() && !btn.getAttribute('title'));
    if (unnamed.length > 0) {
      this.issues.push({
        type: 'unnamed-button',
        severity: 'high',
        count: unnamed.length,
        message: `${unnamed.length} buttons lack accessible names`,
        elements: unnamed.slice(0, 5).map(el => el.outerHTML.substring(0, 100)),
      });
    }
  },

  /** Check for form inputs without labels */
  checkInputs() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])');
    const unlabeled = [...inputs].filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (unlabeled.length > 0) {
      this.issues.push({
        type: 'unlabeled-input',
        severity: 'high',
        count: unlabeled.length,
        message: `${unlabeled.length} inputs lack associated labels`,
        elements: unlabeled.slice(0, 5).map(el => el.outerHTML.substring(0, 100)),
      });
    }
  },

  /** Check for sufficient color contrast (heuristic) */
  checkContrast() {
    // Check for light text on dark backgrounds — common in dark themes
    const elements = document.querySelectorAll('[class*="text-white/30"], [class*="text-white/20"], [class*="text-white/10"]');
    if (elements.length > 0) {
      this.issues.push({
        type: 'low-contrast',
        severity: 'medium',
        count: elements.length,
        message: `${elements.length} elements may have insufficient contrast (muted white text)`,
      });
    }
  },

  /** Check for focusable elements without visible focus indicators */
  checkFocusIndicators() {
    const styleEl = document.getElementById('a11y-focus-test');
    const hasOutlineNone = styleEl?.textContent?.includes('outline: none') || styleEl?.textContent?.includes('outline:none');
    if (hasOutlineNone) {
      this.issues.push({
        type: 'no-focus-indicator',
        severity: 'high',
        count: 1,
        message: 'Global outline:none found — keyboard users cannot see focus',
      });
    }
  },

  /** Check for missing lang attribute */
  checkLang() {
    const html = document.documentElement;
    if (!html.getAttribute('lang')) {
      this.issues.push({
        type: 'missing-lang',
        severity: 'medium',
        count: 1,
        message: '<html> element missing lang attribute',
      });
    }
  },

  /** Run all checks and return report */
  report() {
    this.issues = [];
    this.checkImages();
    this.checkButtons();
    this.checkInputs();
    this.checkContrast();
    this.checkFocusIndicators();
    this.checkLang();

    console.group('♿ Accessibility Audit Report');
    if (this.issues.length === 0) {
      console.log('✅ No common issues detected');
    } else {
      const bySeverity = {};
      this.issues.forEach(issue => {
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + issue.count;
      });
      console.log(`Found ${this.issues.length} issue categories (${Object.values(bySeverity).reduce((a,b)=>a+b,0)} total elements):`);
      this.issues.forEach(issue => {
        console.warn(`[${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }
    console.groupEnd();
    return this.issues;
  },
};

export default a11yAudit;

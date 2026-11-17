// Professional, fully-responsive email templates with distinct themes, headers, body sections, buttons, and footers.

export const templates = [
  {
    id: 1,
    name: 'Executive Product Announcement',
    category: 'Product Launch',
    thumbnail: '📢',
    description: 'Bold corporate hero section with feature highlights and primary CTA',
    previewColor: '#1e3a8a',
    theme: {
      headerBg: '#1e3a8a',
      headerTextColor: '#ffffff',
      accentColor: '#2563eb',
      buttonBg: '#2563eb',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#f8fafc',
      footerTextColor: '#64748b',
    },
    defaultContent: {
      headingText: 'Next-Generation Therapeutics Announcement',
      subheadingText: 'Advanced Clinical Solutions from NVRON Life Science',
      greetingText: 'Dear {{first_name}},',
      messageParagraph1: 'We are thrilled to introduce our newly approved formulation engineered to deliver exceptional patient outcomes and clinical reliability. Our team has spent months perfecting the quality benchmarks.',
      messageParagraph2: 'Explore our comprehensive product dossiers, dosage guidelines, and commercial availability on our dedicated product portal.',
      ctaButtonText: 'View Product Dossier',
      ctaButtonUrl: 'https://nvron.in/products',
      footerLinks: [
        { label: 'Product Catalog', url: 'https://nvron.in/catalog' },
        { label: 'Clinical Studies', url: 'https://nvron.in/clinical' },
        { label: 'Contact Support', url: 'https://nvron.in/contact' },
      ],
      companyName: 'NVRON Life Science Ltd',
      companyAddress: 'Corporate Towers, Tech Corridor, Bangalore 560001',
    }
  },
  {
    id: 2,
    name: 'Weekly Industry Digest',
    category: 'Newsletter',
    thumbnail: '📰',
    description: 'Multi-column editorial newsletter with curated healthcare & pharma updates',
    previewColor: '#065f46',
    theme: {
      headerBg: '#065f46',
      headerTextColor: '#ffffff',
      accentColor: '#059669',
      buttonBg: '#059669',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#f0fdf4',
      footerTextColor: '#475569',
    },
    defaultContent: {
      headingText: 'Healthcare & Pharma Insights',
      subheadingText: 'Issue #42 · Curated Industry Intelligence & Market Trends',
      greetingText: 'Hello {{first_name}},',
      messageParagraph1: 'Here is your weekly roundup of regulatory shifts, emerging bio-pharma breakthroughs, and distribution best practices across the APAC region.',
      messageParagraph2: 'Top Story: How modern cold-chain logistics and real-time telemetry are redefining patient care delivery standards in 2026.',
      ctaButtonText: 'Read Full Newsletter',
      ctaButtonUrl: 'https://nvron.in/insights',
      footerLinks: [
        { label: 'Archive', url: 'https://nvron.in/newsletter' },
        { label: 'Preferences', url: 'https://nvron.in/preferences' },
        { label: 'Unsubscribe', url: '{{unsubscribe_url}}' },
      ],
      companyName: 'NVRON Life Science Insights',
      companyAddress: 'Life Science Innovation Hub, Bangalore',
    }
  },
  {
    id: 3,
    name: 'Seasonal Promotional Offer',
    category: 'Promotional',
    thumbnail: '🏷️',
    description: 'High-energy commercial offer template with coupon code urgency and prominent discount CTA',
    previewColor: '#dc2626',
    theme: {
      headerBg: '#b91c1c',
      headerTextColor: '#ffffff',
      accentColor: '#dc2626',
      buttonBg: '#dc2626',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#fef2f2',
      footerTextColor: '#7f1d1d',
    },
    defaultContent: {
      headingText: 'Special Commercial Bulk Pricing',
      subheadingText: 'Exclusive 20% Rebate on First-Tier Bulk Orders · Limited Window',
      greetingText: 'Greetings {{first_name}},',
      messageParagraph1: 'For this quarter only, we are unlocking tiered distributor pricing and accelerated dispatch for our high-demand medical catalog items.',
      messageParagraph2: 'Use promo code NVROFF20 during checkout or quote it directly to your regional account manager to apply instant credits.',
      ctaButtonText: 'Claim Your Rebate',
      ctaButtonUrl: 'https://nvron.in/offers',
      footerLinks: [
        { label: 'Pricing Tiers', url: 'https://nvron.in/pricing' },
        { label: 'Terms & Conditions', url: 'https://nvron.in/terms' },
        { label: 'Unsubscribe', url: '{{unsubscribe_url}}' },
      ],
      companyName: 'LeadA360 & NVRON Commercial Services',
      companyAddress: 'Commercial Wing, Industrial Zone 4',
    }
  },
  {
    id: 4,
    name: 'SaaS & Tech Release Notes',
    category: 'Product Launch',
    thumbnail: '🚀',
    description: 'Clean modern software changelog with version badges and feature breakdown',
    previewColor: '#6d28d9',
    theme: {
      headerBg: '#4c1d95',
      headerTextColor: '#ffffff',
      accentColor: '#7c3aed',
      buttonBg: '#7c3aed',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#f5f3ff',
      footerTextColor: '#5b21b6',
    },
    defaultContent: {
      headingText: 'LeadA360 Platform Update — v2.4 Release',
      subheadingText: 'High-throughput AWS SES dispatch, real-time analytics & automated suppression',
      greetingText: 'Hi {{first_name}},',
      messageParagraph1: 'We have deployed powerful new features to your LeadA360 workspace! Experience lightning-fast dispatch rates, granular deliverability metrics, and real-time open/click telemetry tracking.',
      messageParagraph2: 'All accounts have been seamlessly upgraded with zero downtime. Check out our changelog to explore how these upgrades boost your campaign ROI.',
      ctaButtonText: 'Explore New Features',
      ctaButtonUrl: 'https://nvron.in/changelog',
      footerLinks: [
        { label: 'Release Notes', url: 'https://nvron.in/updates' },
        { label: 'API Documentation', url: 'https://nvron.in/docs' },
        { label: 'System Status', url: 'https://nvron.in/status' },
      ],
      companyName: 'LeadA360 Campaign Cloud',
      companyAddress: 'Enterprise Cloud Infrastructure, AWS SES Region ap-south-1',
    }
  },
  {
    id: 5,
    name: 'Event Invitation & Medical Conference',
    category: 'Event',
    thumbnail: '🎪',
    description: 'Elegant event card with date badge, agenda highlights, and RSVP call-to-action',
    previewColor: '#b45309',
    theme: {
      headerBg: '#92400e',
      headerTextColor: '#ffffff',
      accentColor: '#d97706',
      buttonBg: '#d97706',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#fffbeb',
      footerTextColor: '#78350f',
    },
    defaultContent: {
      headingText: 'Annual Clinical Excellence Summit 2026',
      subheadingText: 'Join 500+ Healthcare Leaders, Keynote Sessions & Networking',
      greetingText: 'Dear Dr. {{first_name}},',
      messageParagraph1: 'We have the distinct honor of inviting you as our distinguished delegate to the Annual Clinical Summit. Discover groundbreaking innovations shaping the future of pharmaceutical manufacturing and clinical compliance.',
      messageParagraph2: 'Venue: Grand Convention Hall, Bangalore · Date: December 10, 2026 · Hybrid Virtual Option Available.',
      ctaButtonText: 'Confirm Your RSVP Today',
      ctaButtonUrl: 'https://nvron.in/rsvp',
      footerLinks: [
        { label: 'Event Agenda', url: 'https://nvron.in/agenda' },
        { label: 'Speaker Lineup', url: 'https://nvron.in/speakers' },
        { label: 'Venue Location', url: 'https://nvron.in/venue' },
      ],
      companyName: 'NVRON Conference Committee',
      companyAddress: 'Medical Convention Center, Bangalore',
    }
  },
  {
    id: 6,
    name: 'Welcome & Partner Onboarding Series',
    category: 'Transactional',
    thumbnail: '👋',
    description: 'Warm, reassuring onboarding template with quick start checklist and direct manager link',
    previewColor: '#0891b2',
    theme: {
      headerBg: '#0e7490',
      headerTextColor: '#ffffff',
      accentColor: '#06b6d4',
      buttonBg: '#0891b2',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#ecfeff',
      footerTextColor: '#155e75',
    },
    defaultContent: {
      headingText: 'Welcome to the NVRON Healthcare Network',
      subheadingText: 'We are thrilled to have your practice onboarded with us',
      greetingText: 'Welcome {{first_name}},',
      messageParagraph1: 'Thank you for registering with NVRON Life Science. Your account is now active, granting you priority access to pharmaceutical distribution inventories, lab reports, and dedicated supply chain reps.',
      messageParagraph2: 'To get started, simply complete your profile verification and download your verified partner onboarding kit.',
      ctaButtonText: 'Access Your Partner Portal',
      ctaButtonUrl: 'https://nvron.in/portal',
      footerLinks: [
        { label: 'Quick Start Guide', url: 'https://nvron.in/start' },
        { label: 'Account Settings', url: 'https://nvron.in/account' },
        { label: 'Help Desk', url: 'https://nvron.in/support' },
      ],
      companyName: 'NVRON Partner Success Team',
      companyAddress: 'Customer Operations Center, Bangalore',
    }
  },
  {
    id: 7,
    name: 'Minimalist Clean Brand Letter',
    category: 'Custom',
    thumbnail: '✉️',
    description: 'Refined, high-contrast monochrome design focused purely on typography and message clarity',
    previewColor: '#1e293b',
    theme: {
      headerBg: '#0f172a',
      headerTextColor: '#ffffff',
      accentColor: '#334155',
      buttonBg: '#0f172a',
      buttonTextColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#f8fafc',
      footerTextColor: '#64748b',
    },
    defaultContent: {
      headingText: 'Important Official Communication',
      subheadingText: 'Direct update from the Executive Office',
      greetingText: 'Dear {{first_name}},',
      messageParagraph1: 'Please review this official notice regarding scheduled infrastructure improvements and our upcoming quarterly service level agreement updates.',
      messageParagraph2: 'No immediate action is required on your part. Our team is available 24/7 if you have any questions or require custom assistance.',
      ctaButtonText: 'Read Official Statement',
      ctaButtonUrl: 'https://nvron.in/statement',
      footerLinks: [
        { label: 'Terms of Service', url: 'https://nvron.in/terms' },
        { label: 'Privacy Policy', url: 'https://nvron.in/privacy' },
        { label: 'Unsubscribe', url: '{{unsubscribe_url}}' },
      ],
      companyName: 'NVRON Life Science Executive Office',
      companyAddress: 'Executive Headquarters, Bangalore',
    }
  }
];

/**
 * Compiles a bulletproof, responsive HTML email string from a template and customized content fields.
 * Compatible with all major email clients (Gmail, Outlook, Apple Mail, Yahoo).
 */
function formatParagraphsToHtml(rawText) {
  if (!rawText) return '';
  // Split on double newlines or single newlines
  const lines = rawText.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }

    // Bullet points (* or -)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul style="margin: 8px 0 14px 20px; padding: 0; color: #334155;">';
        inList = true;
      }
      html += `<li style="margin-bottom: 6px; line-height: 1.5;">${trimmed.substring(2)}</li>`;
      continue;
    }

    if (inList) {
      html += '</ul>';
      inList = false;
    }

    // Contact details structured line (Email, Website, Phone)
    if (trimmed.startsWith('📧') || trimmed.startsWith('🌐') || trimmed.startsWith('📞')) {
      html += `<div style="margin: 4px 0; font-size: 13px; color: #1e293b; display: flex; align-items: center; gap: 6px;">${trimmed}</div>`;
      continue;
    }

    html += `<p style="margin: 0 0 12px 0; line-height: 1.65; color: #334155;">${trimmed}</p>`;
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

export function generateEmailHtml(template, contentOverrides = {}) {
  const t = template || templates[0];
  const theme = { ...t.theme, ...(contentOverrides.theme || {}) };
  const content = { ...t.defaultContent, ...contentOverrides };

  // Only render footerLinks if explicitly provided and not empty
  const hasFooterLinks = Array.isArray(content.footerLinks) && content.footerLinks.length > 0;
  const footerLinksHtml = hasFooterLinks
    ? `<div style="margin-bottom: 10px; font-size: 12px;">` +
      content.footerLinks
        .map(link => `<a href="${link.url}" style="color: ${theme.accentColor || '#2563eb'}; text-decoration: none; margin: 0 8px; font-weight: 500;">${link.label}</a>`)
        .join(' · ') +
      `</div>`
    : '';

  const bodyPara1Html = formatParagraphsToHtml(content.messageParagraph1);
  const bodyPara2Html = formatParagraphsToHtml(content.messageParagraph2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.headingText || t.name}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <center>
    <!-- Email Container Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: ${theme.bodyBg || '#ffffff'}; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; text-align: left;">
      
      <!-- Header Banner Section -->
      <tr>
        <td style="background-color: ${theme.headerBg}; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${theme.headerTextColor || '#ffffff'}; letter-spacing: -0.02em; line-height: 1.35;">
            ${content.headingText || t.name}
          </h1>
          ${content.subheadingText ? `
          <p style="margin: 8px 0 0 0; font-size: 13px; color: ${theme.headerTextColor || '#ffffff'}; opacity: 0.9; line-height: 1.4;">
            ${content.subheadingText}
          </p>` : ''}
        </td>
      </tr>

      <!-- Body Message Section -->
      <tr>
        <td style="padding: 28px 30px; color: #334155; font-size: 14px; line-height: 1.65;">
          ${content.greetingText ? `
          <p style="margin-top: 0; margin-bottom: 14px; font-weight: 600; font-size: 15px; color: #0f172a;">
            ${content.greetingText}
          </p>` : ''}
          
          ${bodyPara1Html}
          ${bodyPara2Html}

          <!-- Call-To-Action Button -->
          ${content.ctaButtonText ? `
          <div style="text-align: center; margin: 28px 0 20px 0;">
            <a href="${content.ctaButtonUrl || '#'}" style="background-color: ${theme.buttonBg || '#2563eb'}; color: ${theme.buttonTextColor || '#ffffff'}; padding: 12px 28px; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
              ${content.ctaButtonText} &rarr;
            </a>
          </div>` : ''}

          <!-- PDF / File Attachment Download Box -->
          ${content.attachmentUrl ? `
          <div style="margin: 24px 0 10px 0; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: left;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="36" style="vertical-align: middle; font-size: 24px;">📄</td>
                <td style="vertical-align: middle; padding-left: 10px;">
                  <div style="font-size: 13px; font-weight: 700; color: #1e293b;">
                    ${content.attachmentName || 'Attachment (PDF)'}
                  </div>
                  <div style="font-size: 11px; color: #64748b;">Official Attached Document</div>
                </td>
                <td align="right" style="vertical-align: middle;">
                  <a href="${content.attachmentUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 7px 14px; text-decoration: none; font-size: 12px; font-weight: 600; border-radius: 5px; display: inline-block;">
                    Download &darr;
                  </a>
                </td>
              </tr>
            </table>
          </div>` : ''}
        </td>
      </tr>

      <!-- Clean Professional Footer -->
      <tr>
        <td style="background-color: ${theme.footerBg || '#f8fafc'}; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: ${theme.footerTextColor || '#64748b'}; line-height: 1.6;">
          ${footerLinksHtml}
          ${content.companyName ? `
          <div style="font-weight: 700; color: #334155; margin-bottom: 4px; font-size: 12px;">
            ${content.companyName}
          </div>` : ''}
          ${content.companyAddress ? `
          <div style="margin-bottom: 8px; opacity: 0.85; max-width: 480px; margin-left: auto; margin-right: auto;">
            ${content.companyAddress}
          </div>` : ''}
          <div style="font-size: 10px; opacity: 0.75; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
            If you wish to unsubscribe from our mailings, please <a href="{{unsubscribe_url}}" style="color: ${theme.accentColor || '#2563eb'}; text-decoration: underline;">unsubscribe here</a>.
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
}

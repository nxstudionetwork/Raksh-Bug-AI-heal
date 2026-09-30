const Utils = {
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  throttle(fn, limit = 300) {
    let inThrottle = false;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  },

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  },

  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return this.formatDate(timestamp);
  },

  truncate(str, len = 50) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  },

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  getSeverity(score) {
    if (score <= 20) return { label: 'Safe', class: 'safe', color: '#22c55e' };
    if (score <= 40) return { label: 'Low', class: 'low', color: '#3b82f6' };
    if (score <= 60) return { label: 'Medium', class: 'medium', color: '#eab308' };
    if (score <= 80) return { label: 'High', class: 'high', color: '#f97316' };
    return { label: 'Critical', class: 'critical', color: '#ef4444' };
  },

  getScoreColor(score) {
    const s = this.getSeverity(score);
    return s.color;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },



  getFileIcon(type) {
    const icons = {
      pdf: '📄', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
      pptx: '📽️', ppt: '📽️', zip: '📦', rar: '📦', '7z': '📦',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️',
      mp3: '🎵', wav: '🎵', ogg: '🎵', m4a: '🎵',
      mp4: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬',
      txt: '📃', csv: '📃', json: '📃', xml: '📃',
      html: '🌐', htm: '🌐', css: '🎨', js: '⚡',
      default: '📎'
    };
    const ext = type?.toLowerCase().replace('.', '') || '';
    return icons[ext] || icons.default;
  },

  detectFileType(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'document';
    if (['doc', 'docx'].includes(ext)) return 'document';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
    return 'unknown';
  }
};

const CyberTips = [
  'Never share your OTP with anyone, even if they claim to be from your bank.',
  'Enable two-factor authentication on all your online accounts.',
  'Use a password manager to generate and store strong, unique passwords.',
  'Always verify the sender email address before clicking any links.',
  'Keep your software and operating system updated to patch security vulnerabilities.',
  'Be cautious of urgent messages that demand immediate action.',
  'Never download attachments from unknown or unsolicited emails.',
  'Use encrypted messaging apps for sensitive conversations.',
  'Regularly check your bank statements for unauthorized transactions.',
  'Lock your devices when not in use with a strong PIN or biometric.',
  'Avoid using public Wi-Fi for banking or sensitive transactions.',
  'Back up your important data regularly to an external drive or cloud.',
  'Review app permissions regularly and revoke unnecessary access.',
  'Be skeptical of "too good to be true" offers and deals online.',
  'Set up transaction alerts for all your bank accounts.',
  'Use a VPN when accessing sensitive information on public networks.',
  'Never let anyone remotely access your computer unless you trust them completely.',
  'Check for HTTPS and the padlock icon before entering sensitive data on websites.',
  'Log out of accounts when using shared or public computers.',
  'Monitor your credit score and report any suspicious activity immediately.'
];

const OnboardingSteps = [
  { icon: '🛡️', title: 'Welcome to RAKSH', desc: 'Your AI-powered digital security guardian. I protect you from scams, phishing, and online fraud.' },
  { icon: '🔍', title: 'Scan Anything', desc: 'Analyze messages, links, QR codes, images, files, voice notes, and videos for threats.' },
  { icon: '📊', title: 'Monitor Your Security', desc: 'Track your protection status, view analytics, and stay informed about trending scams.' },
  { icon: '👥', title: 'Join the Community', desc: 'Share and discover scams with the community. Together we stay safer.' },
  { icon: '⚡', title: 'Quick Tips', desc: 'Press Ctrl+K anytime to open the command palette. Click the + button for quick actions.' }
];

const CommunityPosts = [
  {
    id: 'cp1', author: 'CyberShield', avatar: '🛡️', avatarBg: '#6366f1', verified: true,
    time: '12 min ago', threatTag: 'Phishing',
    content: 'Just received a convincing phishing email pretending to be from "Amazon Support". The domain was "amaz0n-secure[.]com". Always check the sender address carefully! They asked me to verify my payment method.',
    hashtags: ['phishing', 'amazon', 'email-scam'],
    likes: 42, reposts: 12, comments: 8, bookmarked: false
  },
  {
    id: 'cp2', author: 'SafeSurfer', avatar: '🌊', avatarBg: '#06b6d4', verified: true,
    time: '45 min ago', threatTag: 'QR Scam',
    content: 'Found a tampered QR code at a parking meter today. Someone placed a sticker over the legitimate code. Scanned it with RAKSH and it flagged it as malicious. Always inspect QR codes before scanning!',
    hashtags: ['qr-scam', 'physical-security', 'parking'],
    likes: 28, reposts: 7, comments: 5, bookmarked: false,
    attachment: { type: 'link', preview: 'RAKSH flagged this QR as HIGH RISK (92%)' }
  },
  {
    id: 'cp3', author: 'TechGuardian', avatar: '⚡', avatarBg: '#22c55e', verified: false,
    time: '2 hours ago', threatTag: 'Vishing',
    content: 'PSA: New vishing campaign going around. Caller claims to be from "SBI Cyber Crime Department" and asks you to install AnyDesk for "verification". Banks will NEVER ask you to install remote access software. Hang up immediately!',
    hashtags: ['vishing', 'bank-fraud', 'remote-access'],
    likes: 67, reposts: 23, comments: 15, bookmarked: false
  },
  {
    id: 'cp4', author: 'DigitalDetective', avatar: '🔍', avatarBg: '#f97316', verified: true,
    time: '3 hours ago', threatTag: 'Investment Scam',
    content: 'Analyzed a "crypto investment" WhatsApp group. They promise 10% daily returns. Classic Ponzi scheme. The "profit screenshots" are fake. Remember: if it sounds too good to be true, it IS too good to be true.',
    hashtags: ['crypto-scam', 'ponzi', 'whatsapp'],
    likes: 53, reposts: 18, comments: 11, bookmarked: false
  },
  {
    id: 'cp5', author: 'PrivacyPro', avatar: '🔒', avatarBg: '#8b5cf6', verified: false,
    time: '5 hours ago', threatTag: 'Safety Tip',
    content: 'Quick tip: Use a separate email address for your financial accounts. If one email gets compromised, your bank accounts won\'t be affected. I use different emails for banking, shopping, and social media.',
    hashtags: ['tip', 'privacy', 'email-security'],
    likes: 89, reposts: 34, comments: 6, bookmarked: false
  },
  {
    id: 'cp6', author: 'ScamWatcher', avatar: '👁️', avatarBg: '#ef4444', verified: true,
    time: '6 hours ago', threatTag: 'Fake Job',
    content: 'Fake job alert: "Google Work From Home - ₹75,000/month - No experience needed". They ask for a "registration fee" of ₹1,999. Google doesn\'t charge for job applications. Report and block!',
    hashtags: ['job-scam', 'google', 'registration-fee'],
    likes: 74, reposts: 41, comments: 9, bookmarked: false,
    poll: { question: 'Have you received similar job scam messages?', options: ['Yes, multiple times', 'Once or twice', 'Never'], votes: [156, 89, 45] }
  }
];

const DATA = {
  trendingScams: [
    { name: 'Bank OTP Fraud', count: 1247, color: '#ef4444' },
    { name: 'Fake Delivery SMS', count: 983, color: '#f97316' },
    { name: 'WhatsApp Hijack', count: 856, color: '#eab308' },
    { name: 'Fake Job Offer', count: 721, color: '#3b82f6' },
    { name: 'Investment Scam', count: 654, color: '#6366f1' },
    { name: 'QR Code Phishing', count: 512, color: '#06b6d4' },
    { name: 'Fake Support Call', count: 478, color: '#22c55e' },
    { name: 'Crypto Giveaway', count: 389, color: '#ef4444' }
  ],

  trendingThreats: [
    { name: 'Bank OTP Fraud', count: 1247, trend: '+18%', direction: 'up' },
    { name: 'Fake Delivery SMS', count: 983, trend: '+12%', direction: 'up' },
    { name: 'WhatsApp Hijacking', count: 856, trend: '+25%', direction: 'up' },
    { name: 'Investment Scams', count: 721, trend: '-3%', direction: 'down' },
    { name: 'QR Code Phishing', count: 654, trend: '+45%', direction: 'up' },
    { name: 'Fake Job Offers', count: 512, trend: '+8%', direction: 'up' },
    { name: 'AI Voice Scams', count: 478, trend: '+67%', direction: 'up' },
    { name: 'SIM Swap Attacks', count: 389, trend: '-5%', direction: 'down' }
  ],
  communityAlerts: [
    { text: 'Fake banking app targeting SBI customers reported.', severity: 'critical', time: '5m ago' },
    { text: 'New phishing campaign using AI voice calls detected.', severity: 'critical', time: '12m ago' },
    { text: 'Fake QR codes found on parking meters in MG Road.', severity: 'warning', time: '28m ago' },
    { text: 'WhatsApp scam: "Free Netflix subscription" link spreading.', severity: 'warning', time: '45m ago' },
    { text: 'Fake job offer from "Google HR" targeting freshers.', severity: 'info', time: '1h ago' },
    { text: 'SIM swap attacks increasing in Bangalore region.', severity: 'info', time: '2h ago' }
  ],

  knowledgeArticles: [
    {
      id: 'k1', category: 'Scam Awareness', title: 'How to Identify Phishing Emails',
      excerpt: 'Phishing emails are designed to trick you into revealing sensitive information...',
      content: 'Phishing emails often create a sense of urgency, use generic greetings, and contain suspicious links. Always verify the sender email address, look for spelling mistakes, and never click on links directly. Legitimate companies never ask for passwords or OTPs via email.',
      bookmarkable: true
    },
    {
      id: 'k2', category: 'Banking Scams', title: 'Protecting Against Banking Fraud',
      excerpt: 'Banking scams are becoming increasingly sophisticated with AI-powered social engineering...',
      content: 'Never share your OTP, PIN, or CVV with anyone. Banks never call asking for these details. Use only official banking apps and websites. Enable transaction alerts and set daily limits. If you receive a suspicious call, hang up and call your bank directly using the number on your card.',
      bookmarkable: true
    },
    {
      id: 'k3', category: 'Investment Scams', title: 'Spotting Fake Investment Opportunities',
      excerpt: 'If it sounds too good to be true, it probably is. Learn how to spot investment scams...',
      content: 'Fake investment schemes promise guaranteed high returns with no risk. They often use pressure tactics like "limited time offer". Always verify the company with SEBI registration. Never invest based on WhatsApp or Telegram tips. Legitimate investments carry risk and are never guaranteed.',
      bookmarkable: true
    },
    {
      id: 'k4', category: 'Fake Jobs', title: 'Avoiding Job Offer Scams',
      excerpt: 'Fake job offers are used to steal personal information and money...',
      content: 'Legitimate companies never ask for money for job applications, training, or visa processing. Be suspicious of offers that seem too good without proper interviews. Verify the company website domain, check official career pages, and never share passport copies or bank details without verification.',
      bookmarkable: true
    },
    {
      id: 'k5', category: 'Fake QR', title: 'QR Code Scams: What to Watch For',
      excerpt: 'Fake QR codes can lead to malicious websites or payment fraud...',
      content: 'QR codes can be tampered with by placing stickers over legitimate codes. Before scanning, check if the QR code sticker looks suspicious or misaligned. Use RAKSH\'s QR scanner to verify links before opening. Never make payments through unknown QR codes.',
      bookmarkable: true
    },
    {
      id: 'k6', category: 'Fake Delivery', title: 'Delivery Scams: Don\'t Get Tricked',
      excerpt: 'Fake delivery notifications are a common way to spread malware...',
      content: 'Fake delivery SMS messages ask you to click a link to "reschedule" or "track" your package. These links lead to phishing sites or malware downloads. If you\'re not expecting a package, delete the message. If you are, use the official tracking website directly.',
      bookmarkable: true
    },
    {
      id: 'k7', category: 'OTP Fraud', title: 'How OTP Frauds Work and How to Stay Safe',
      excerpt: 'OTP frauds trick you into sharing your one-time password with scammers...',
      content: 'Scammers call pretending to be bank representatives and ask for your OTP "for verification". Some use SIM swapping to intercept your OTPs. Never share OTPs with anyone. If someone asks for your OTP, they are a scammer. Report such calls immediately.',
      bookmarkable: true
    },
    {
      id: 'k8', category: 'AI Scams', title: 'AI-Powered Scams: The New Frontier',
      excerpt: 'AI is being used to create convincing deepfakes, voice clones, and chatbots for scams...',
      content: 'AI scams include deepfake video calls, voice cloning to impersonate family members, and AI-generated phishing emails that are nearly perfect. Be cautious even with voice/video calls requesting money. Have a safe word with family members for verification.',
      bookmarkable: true
    },
    {
      id: 'k9', category: 'Identity Theft', title: 'Preventing Identity Theft Online',
      excerpt: 'Identity theft can damage your credit and reputation. Learn how to protect yourself...',
      content: 'Use strong, unique passwords for every account. Enable two-factor authentication wherever possible. Monitor your credit reports regularly. Shred documents containing personal information. Be cautious about sharing personal details on social media.',
      bookmarkable: true
    },
    {
      id: 'k10', category: 'Security Tips', title: '10 Essential Security Practices',
      excerpt: 'Simple habits that dramatically improve your digital security...',
      content: '1. Use a password manager\n2. Enable 2FA on all accounts\n3. Keep software updated\n4. Don\'t reuse passwords\n5. Verify before clicking\n6. Use encrypted messaging\n7. Regular backups\n8. Lock your devices\n9. Check privacy settings\n10. Trust your instincts',
      bookmarkable: true
    }
  ],

  communityPosts: [
    {
      id: 'c1', author: 'SecurityGuru', avatar: '🛡️', avatarBg: '#6366f1',
      time: '2 hours ago',
      content: 'Just received a convincing phishing email pretending to be from Amazon. The domain was "amaz0n-support[.]com". Always check the sender email address carefully!',
      tags: ['phishing', 'amazon', 'email'],
      likes: 24, comments: 7
    },
    {
      id: 'c2', author: 'CyberWatcher', avatar: '👁️', avatarBg: '#06b6d4',
      time: '4 hours ago',
      content: 'A new QR code scam is spreading in coffee shops. Scammers place their own QR stickers over the legitimate payment QR codes. Always check if the QR sticker looks tampered!',
      tags: ['qr-scam', 'payment', 'physical'],
      likes: 18, comments: 5
    },
    {
      id: 'c3', author: 'TechShield', avatar: '🔒', avatarBg: '#22c55e',
      time: '6 hours ago',
      content: 'Deepfake call alert! Someone received a call that sounded exactly like their CEO asking for an urgent wire transfer. Always verify through a separate channel before sending money!',
      tags: ['deepfake', 'ai-scam', 'urgent'],
      likes: 42, comments: 12
    },
    {
      id: 'c4', author: 'SafeNet', avatar: '🌐', avatarBg: '#f97316',
      time: '8 hours ago',
      content: 'Fake job scam targeting freshers: "Google Work From Home - Rs 50,000/month". They ask for a "registration fee" of Rs 999. Legitimate companies never charge for job applications!',
      tags: ['job-scam', 'freshers', 'google'],
      likes: 31, comments: 8
    },
    {
      id: 'c5', author: 'DigitalGuard', avatar: '⚡', avatarBg: '#eab308',
      time: '12 hours ago',
      content: 'Tip of the day: Enable transaction alerts for ALL your bank accounts, even if they have zero balance. This way you\'ll know immediately if someone tries to open a credit line in your name.',
      tags: ['tip', 'banking', 'security'],
      likes: 56, comments: 3
    }
  ],

  faqData: [
    {
      q: 'How does RAKSH detect scams?',
      a: 'RAKSH uses simulated AI analysis to scan messages, links, and files for suspicious patterns. It checks for urgent language, fake keywords, suspicious URLs, and other common scam indicators. When a real AI backend is connected, detection will be even more accurate.'
    },
    {
      q: 'Is my data private?',
      a: 'Yes. All scans are processed locally in your browser. No data is sent to any server. You can enable Privacy Mode in settings for additional protection.'
    },
    {
      q: 'Does RAKSH monitor my WhatsApp or Signal?',
      a: 'No. RAKSH is a desktop security companion. It cannot access your private messages. You must manually copy and paste suspicious messages into the scan tool for analysis.'
    },
    {
      q: 'What should I do if a scan detects a threat?',
      a: 'Do not click any links, download any files, or respond to the message. Delete it immediately. If financial information is involved, contact your bank. Use the report feature to alert the community.'
    },
    {
      q: 'Can RAKSH remove malware from my device?',
      a: 'No. RAKSH is a detection tool. It helps you identify threats. For malware removal, use dedicated antivirus software.'
    },
    {
      q: 'How accurate is the AI analysis?',
      a: 'The current version uses simulated AI with rule-based detection. Accuracy will improve significantly when the real AI engine is connected.'
    }
  ],

  aiResponses: [
    { keywords: ['safe', 'legitimate', 'genuine', 'real'], response: 'Based on my analysis, this appears to be safe. I detected no suspicious patterns, urgent language, or deceptive elements. However, always stay vigilant.' },
    { keywords: ['phishing'], response: 'Phishing is a type of social engineering attack where scammers pose as legitimate entities to steal sensitive information. They often use urgent language, fake login pages, and spoofed email addresses. Never click links in suspicious messages.' },
    { keywords: ['qr', 'qr code'], response: 'QR code scams, or "quishing," involve tampered QR codes that lead to malicious websites or payment portals. Always inspect QR codes for tampering before scanning. Use RAKSH\'s QR scanner to verify the destination URL.' },
    { keywords: ['suspect', 'suspicious'], response: 'Something raised a red flag. This content may be suspicious. Look for: unusual sender address, urgent calls to action, requests for personal information, and poor grammar. When in doubt, don\'t engage.' },
    { keywords: ['otp', 'one time password'], response: 'Never share your OTP with anyone, even if they claim to be from your bank. OTP fraud is one of the most common scams. Your bank will never call and ask for your OTP. If someone does, hang up immediately.' },
    { keywords: ['bank', 'banking'], response: 'Banking scams often involve fake calls, SMS, or emails claiming your account is blocked or compromised. Always call your bank directly using the number on your official banking app or card. Never use numbers from suspicious messages.' },
    { keywords: ['investment', 'crypto', 'bitcoin'], response: 'Investment scams promise guaranteed high returns with no risk. Remember: if it sounds too good to be true, it probably is. Always verify schemes with SEBI or other regulatory bodies before investing.' },
    { keywords: ['whatsapp', 'telegram', 'signal'], response: 'Messaging app scams are common. Scammers may impersonate your contacts, create fake groups, or send malicious links. Never share OTPs, click unknown links, or forward money based on messages.' },
    { keywords: ['job', 'work', 'career', 'employment'], response: 'Job scams often ask for registration fees, training costs, or sensitive documents upfront. Legitimate employers never ask for money. Verify job offers on official company websites.' },
    { keywords: ['delivery', 'package', 'courier', 'shipment'], response: 'Delivery scams send fake tracking links that lead to phishing sites. If you\'re not expecting a package, don\'t click. If you are, use the official courier website directly.' },
    { keywords: ['deepfake', 'ai voice', 'voice clone'], response: 'AI-powered scams use deepfake technology to impersonate people you trust. Set up a safe word with family members to verify identity during calls requesting money or sensitive information.' }
  ],

  scamDatabase: [
    { id: 'sd1', name: 'Bank OTP Fraud', description: 'Scammer calls pretending to be from bank, asks for OTP to "reverse fraudulent transaction".', indicators: ['Unsolicited call claiming to be from bank', 'Request for OTP/CVV/PIN', 'Creates urgency about account compromise', 'Spoofed bank phone number'], prevention: 'Your bank never asks for OTP. Hang up and call bank directly.', severity: 'Critical', lastUpdated: '2026-06-28' },
    { id: 'sd2', name: 'Fake Delivery SMS', description: 'Fake courier delivery SMS with tracking link that leads to phishing site.', indicators: ['SMS from unknown number', 'Suspicious shortened URL', 'Package you did not order', 'Requests personal information to "confirm delivery"'], prevention: 'Use official courier website directly. Never click SMS links.', severity: 'High', lastUpdated: '2026-06-27' },
    { id: 'sd3', name: 'WhatsApp Hijacking', description: 'Scammer sends WhatsApp verification code request, then calls pretending to be support asking for the code.', indicators: ['Unexpected WhatsApp verification SMS', 'Call from "WhatsApp Support"', 'Request to share 6-digit code', 'Message from compromised contact asking for money'], prevention: 'Never share verification codes. Enable two-step verification in WhatsApp.', severity: 'Critical', lastUpdated: '2026-06-26' },
    { id: 'sd4', name: 'QR Code Phishing', description: 'Tampered QR codes placed over legitimate ones in public places leading to malicious websites.', indicators: ['QR sticker over original code', 'Misaligned or crooked QR sticker', 'URL that does not match expected domain', 'Requests payment on unknown payment page'], prevention: 'Inspect QR codes before scanning. Use RAKSH QR scanner to verify destination URL.', severity: 'High', lastUpdated: '2026-06-25' },
    { id: 'sd5', name: 'Fake Job Offer', description: 'Fake job offers from prestigious companies asking for registration fees or personal documents.', indicators: ['Job offer without proper interview', 'Request for "registration/training fee"', 'Unprofessional email domain (gmail.com, etc.)', 'Salary far above market rate for position'], prevention: 'Legitimate companies never ask for money. Verify job on official company careers page.', severity: 'High', lastUpdated: '2026-06-24' },
    { id: 'sd6', name: 'Investment Ponzi Scheme', description: 'Crypto investment scheme promising unrealistic daily returns, using fake testimonials.', indicators: ['Guaranteed high returns (10%+ daily)', 'Referral bonus for bringing new investors', 'Pressure to "invest now before opportunity closes"', 'No clear business model or registration'], prevention: 'Verify with SEBI. If it sounds too good to be true, it is a scam.', severity: 'Critical', lastUpdated: '2026-06-23' },
    { id: 'sd7', name: 'AI Voice Clone Scam', description: 'Scammer uses AI voice cloning to impersonate family member or boss requesting urgent money transfer.', indicators: ['Call from "family member" with unfamiliar number', 'Voice sounds slightly robotic or unnatural', 'Urgent request for money', 'Excuses for not being able to video call'], prevention: 'Have a family safe word. Verify through separate channel before sending money.', severity: 'Critical', lastUpdated: '2026-06-22' },
    { id: 'sd8', name: 'KYC Update Fraud', description: 'Fake SMS/email claiming bank KYC is expired and needs immediate update via a link.', indicators: ['Threatening to block account if not updated', 'Link to website that looks like bank but wrong URL', 'Requests full name, DOB, PAN, account number', 'Poor grammar and urgent tone'], prevention: 'Banks send KYC reminders via registered email/app. Never click SMS links.', severity: 'High', lastUpdated: '2026-06-21' },
    { id: 'sd9', name: 'Fake Tech Support', description: 'Scammer calls claiming to be from Microsoft/Apple about virus on your computer.', indicators: ['Unsolicited call from "tech support"', 'Claims your computer has a virus', 'Requests remote access to your computer', 'Asks for payment to "fix" non-existent issues'], prevention: 'Microsoft/Apple never call about computer issues. Hang up immediately.', severity: 'High', lastUpdated: '2026-06-20' },
    { id: 'sd10', name: 'SIM Swap Attack', description: 'Scammer tricks mobile provider into transferring your number to their SIM to intercept OTPs.', indicators: ['Sudden loss of mobile network', 'Unable to make calls or use mobile data', 'Notification of SIM change from provider', 'Unauthorized transactions on bank accounts'], prevention: 'Contact provider immediately if you lose network. Use app-based 2FA instead of SMS.', severity: 'Critical', lastUpdated: '2026-06-19' },
    { id: 'sd11', name: 'Fake Shopping Site', description: 'Fraudulent e-commerce site offering huge discounts on popular products.', indicators: ['Prices 70-90% below market rate', 'Site created less than 30 days ago', 'No contact information or physical address', 'Only accepts payment via UPI or wire transfer'], prevention: 'Check site age on whois. Look for reviews. Pay via credit card for chargeback protection.', severity: 'High', lastUpdated: '2026-06-18' },
    { id: 'sd12', name: 'Romance Scam', description: 'Fake online relationship used to gain trust and eventually request money or financial help.', indicators: ['Professed love within days/weeks', 'Always has excuse for not video calling', 'Requests money for "emergency" or "travel to meet you"', 'Inconsistent personal details and stories'], prevention: 'Never send money to someone you have not met in person. Verify identity through video calls.', severity: 'Medium', lastUpdated: '2026-06-17' },
    { id: 'sd13', name: 'Fake Lottery/Winning', description: 'Congratulations! You won a lottery you never entered. Pay a "processing fee" to claim.', indicators: ['Notification of winning a contest you did not enter', 'Request for "processing/verification fee"', 'Urgency to claim prize before it expires', 'Request for bank details to "deposit winnings"'], prevention: 'Legitimate lottery never asks for money to release winnings. Delete and block.', severity: 'Medium', lastUpdated: '2026-06-16' },
    { id: 'sd14', name: 'Parcel/Courier Scam', description: 'Fake call from "customs" claiming your parcel contains illegal items and needs "verification fee".', indicators: ['Call from "customs/police" about parcel', 'Threat of legal action unless fee is paid', 'Parcel you did not send', 'Request for payment via UPI or gift cards'], prevention: 'Customs communicates via official letters, not phone calls demanding immediate payment.', severity: 'High', lastUpdated: '2026-06-15' },
    { id: 'sd15', name: 'Fake Insurance Claim', description: 'Scammer posing as insurance agent offering claim settlement or policy renewal with discount.', indicators: ['Unsolicited call about insurance claim', 'Request for policy details and personal info', 'Pressure to renew immediately for "special discount"', 'Link to fake insurance portal'], prevention: 'Contact your insurance agent directly using official number. Never share policy details on call.', severity: 'Medium', lastUpdated: '2026-06-14' }
  ],

  securityNews: [
    { id: 'sn1', title: 'New Phishing Campaign Targets Banking Customers', source: 'CyberSecurity News', time: '2h ago', severity: 'critical', url: '#' },
    { id: 'sn2', title: 'AI Voice Scams Rise 300% in 2026', source: 'ThreatPost', time: '4h ago', severity: 'critical', url: '#' },
    { id: 'sn3', title: 'New Android Malware Steals OTPs via Accessibility Services', source: 'The Hacker News', time: '6h ago', severity: 'high', url: '#' },
    { id: 'sn4', title: 'QR Code Phishing Expands to Parking Meters Nationwide', source: 'SecurityWeek', time: '8h ago', severity: 'high', url: '#' },
    { id: 'sn5', title: 'Fake KYC Links Target SBI, HDFC, ICICI Customers', source: 'CyberCrime Bureau', time: '12h ago', severity: 'warning', url: '#' },
    { id: 'sn6', title: 'Deepfake Video Calls Used in Corporate Wire Fraud', source: 'Dark Reading', time: '1d ago', severity: 'critical', url: '#' },
    { id: 'sn7', title: 'WhatsApp Verification Code Scam Evolves with AI Chatbots', source: 'TechCrunch', time: '1d ago', severity: 'warning', url: '#' },
    { id: 'sn8', title: 'Fake Job Scams on LinkedIn Target Remote Workers', source: 'KrebsOnSecurity', time: '2d ago', severity: 'high', url: '#' },
    { id: 'sn9', title: 'Crypto Drainer Malware Disguised as Wallet Apps', source: 'BleepingComputer', time: '2d ago', severity: 'high', url: '#' },
    { id: 'sn10', title: 'Insurance Fraud Calls Spike During Tax Season', source: 'CyberSecurity Insiders', time: '3d ago', severity: 'medium', url: '#' }
  ],

  threatData: {
    campaigns: [
      { name: 'Operation FakeBank', activeTargets: 'SBI, HDFC, ICICI customers', method: 'SMS phishing + voice calls', scale: '10,000+ targets/day', status: 'Active', severity: 'Critical' },
      { name: 'QR Jack', activeTargets: 'Parking meters, restaurants', method: 'Physical QR code sticker replacement', scale: '5,000+ QR codes placed', status: 'Active', severity: 'High' },
      { name: 'AI Voice Network', activeTargets: 'Senior citizens, corporate employees', method: 'AI voice cloning of family/CEO', scale: '3,000+ calls/day', status: 'Active', severity: 'Critical' },
      { name: 'WhatsApp Hijack 2.0', activeTargets: 'All WhatsApp users', method: 'Verification code interception + AI chat', scale: '8,000+ accounts compromised', status: 'Active', severity: 'Critical' },
      { name: 'FakeJobIndia', activeTargets: 'College freshers, job seekers', method: 'Fake job portals + registration fees', scale: '15,000+ victims', status: 'Active', severity: 'High' },
      { name: 'CryptoPonzi 2026', activeTargets: 'Crypto investors on Telegram', method: 'Fake investment platform + referral rewards', scale: '50,000+ users lured', status: 'Mitigated', severity: 'Critical' }
    ],
    topAttacks: [
      { name: 'Phishing', percentage: 42, count: 12840, trend: '+15%' },
      { name: 'Vishing', percentage: 22, count: 6720, trend: '+28%' },
      { name: 'SMS Scams', percentage: 18, count: 5490, trend: '+8%' },
      { name: 'QR Phishing', percentage: 10, count: 3050, trend: '+45%' },
      { name: 'Deepfake', percentage: 5, count: 1530, trend: '+67%' },
      { name: 'Other', percentage: 3, count: 920, trend: '+2%' }
    ],
    highRiskDomains: [
      { domain: 'sbi-secure-update[.]com', risk: 'Critical', category: 'Banking Phishing', blocks: 12470 },
      { domain: 'amaz0n-verify[.]xyz', risk: 'Critical', category: 'E-commerce Phishing', blocks: 8930 },
      { domain: 'google-job-offer[.]top', risk: 'High', category: 'Job Scam', blocks: 6540 },
      { domain: 'dtdc-parcel-track[.]club', risk: 'High', category: 'Delivery Scam', blocks: 5210 },
      { domain: 'free-netflix-sub[.]win', risk: 'High', category: 'Subscription Scam', blocks: 4870 },
      { domain: 'whatsapp-verify[.]bid', risk: 'Critical', category: 'Social Engineering', blocks: 4320 },
      { domain: 'crypto-invest-io[.]review', risk: 'Critical', category: 'Investment Scam', blocks: 3890 },
      { domain: 'kyc-update-hdfc[.]download', risk: 'High', category: 'KYC Fraud', blocks: 3120 },
      { domain: 'irctc-refund[.]work', risk: 'Medium', category: 'Refund Scam', blocks: 2340 },
      { domain: 'flipkart-offer[.]date', risk: 'Medium', category: 'Shopping Scam', blocks: 1890 }
    ],
    timeline: [
      { date: '2026-06-30', event: 'New QR code phishing campaign detected in Bangalore', severity: 'high' },
      { date: '2026-06-29', event: 'AI voice scam gang busted by cyber police', severity: 'info' },
      { date: '2026-06-28', event: 'Fake KYC SMS targeting HDFC customers spikes 200%', severity: 'critical' },
      { date: '2026-06-27', event: 'WhatsApp verification code scam evolves with AI chatbots', severity: 'high' },
      { date: '2026-06-26', event: 'Crypto investment Ponzi scheme traced to international ring', severity: 'critical' },
      { date: '2026-06-25', event: 'Fake job offers on LinkedIn targeting remote workers', severity: 'high' },
      { date: '2026-06-24', event: 'New Android malware uses accessibility services to steal OTPs', severity: 'critical' },
      { date: '2026-06-23', event: 'Deepfake CEO scam attempts reported at 3 major companies', severity: 'high' },
      { date: '2026-06-22', event: 'Fake insurance call campaign targeting senior citizens', severity: 'medium' },
      { date: '2026-06-21', event: 'SIM swap attacks increasing, telecom companies alerted', severity: 'high' }
    ],
    attackStats: {
      totalAttacks: 30550,
      blockedByRaksh: 28740,
      activeCampaigns: 5,
      mitigatedCampaigns: 12,
      avgResponseTime: '1.2s',
      detectionRate: '94.1%'
    }
  },

  communityChallenges: [
    { id: 'ch1', title: 'Spot the Phishing', description: 'Identify phishing emails in our quiz. Score 10/10 to earn the Phishing Hunter badge.', participants: 1247, daysLeft: 5, reward: 'Phishing Hunter Badge' },
    { id: 'ch2', title: 'Security Awareness Champion', description: 'Complete all knowledge modules and earn the highest security awareness score.', participants: 892, daysLeft: 12, reward: 'Awareness Champion Badge' },
    { id: 'ch3', title: 'Scam Reporter', description: 'Report 10 unique scams to the community. Help others stay safe from fraud.', participants: 634, daysLeft: 8, reward: 'Scam Reporter Badge' },
    { id: 'ch4', title: 'Zero Click Challenge', description: 'Go 30 days without clicking a single suspicious link. Build the habit of verification.', participants: 2156, daysLeft: 3, reward: 'Safe Clicker Badge' }
  ],

  pinConversations: [],

  mockScans: [],

  mockNotifications: []
};

function generateMockScans(count = 50) {
  const categories = ['Phishing', 'Banking Scam', 'Delivery Scam', 'Job Scam', 'Investment Scam', 'QR Scam', 'Social Engineering', 'Tech Support', 'Spam', 'Safe'];
  const severities = ['Safe', 'Low', 'Medium', 'High', 'Critical'];
  const riskScores = { 'Safe': [0, 20], 'Low': [21, 40], 'Medium': [41, 60], 'High': [61, 80], 'Critical': [81, 100] };
  const scanTypes = ['Text', 'Link', 'QR', 'File', 'Voice'];
  const sampleTexts = [
    'URGENT: Your account has been compromised. Click here to verify immediately.',
    'Congratulations! You won a free iPhone. Claim your prize now.',
    'Your package is on hold. Update delivery address: http://bit.ly/fake-track',
    'Dear Customer, your SBI account will be suspended. Update KYC now.',
    'Hi, this is a reminder for your appointment tomorrow at 3 PM.',
    'Work from home - Earn ₹50,000/month. No experience needed. Register now.',
    'Your Netflix subscription expired. Click to renew and get 1 month free.',
    'Meeting agenda for tomorrow\'s project review attached.',
    'Fake QR code detected at parking meter - do not scan.',
    'Your OTP for transaction is 284756. Do not share this code.',
    'Investment opportunity: 10% daily returns on crypto. Limited slots!',
    'Please find the quarterly report attached for your review.',
    'Alert: Someone tried to login to your account from new device.',
    'Your India Post parcel #RB284756293 is awaiting clearance. Pay customs fee: tinyurl.com/fake-customs',
    'Can you send me the presentation slides when you get a chance?',
    'Amazon: Your order #OD1284756 has been dispatched. Track here.',
    'Fake Microsoft support: Your computer has a virus! Call now for free scan.',
    'Your gas bill payment is due. Pay now to avoid late fee.',
    'Exclusive offer: 80% off on all products. Limited time sale!',
    'Regarding your loan application, please submit income documents.',
    'Your WhatsApp account will be deactivated. Verify here: wa-secure.xyz',
    'Thanks for your application. We would like to schedule an interview.',
    'Your credit card has been charged ₹49,999. Dispute? Call immediately.',
    'Get rich quick! Bitcoin trading robot guarantees 500% returns.',
    'Conference registration reminder for next week.',
    'Deepfake alert: CEO\'s voice cloned to authorize fake wire transfer.',
    'SBI: Your debit card has been blocked due to suspicious activity.',
    'Your insurance policy lapsed. Renew now for continuous coverage.',
    'Fake LinkedIn connection request from recruiter with suspicious profile.',
    'Thank you for your purchase. Your receipt is attached.',
    'Airline ticket confirmation for your upcoming trip.',
    'Free Netflix subscription for 1 year! Claim now: netflix-free.xyz',
    'Security update: Please change your password immediately.',
    'Fake QR code on food menu redirects to malicious payment page.',
    'Your account has been locked. Verify identity to unlock.',
    'Monthly security newsletter - June 2026 edition.',
    'Beware: New phishing campaign targeting banking customers.',
    'SIM swap detected: Your mobile number has been transferred to new device.',
    'Your domain registration is about to expire. Renew now.',
    'Quick update on the project status from yesterday\'s meeting.',
    'Fake KYC: Click to update your Aadhaar-PAN link status.',
    'Your vehicle insurance claim has been approved. Pay processing fee.',
    'Invitation to speak at cybersecurity conference next month.',
    'Fake WhatsApp group: "Daily Profit Crypto Signals" - investment scam.',
    'Your electricity bill payment received. Thank you.',
    'Job offer: Senior Developer at Google - ₹1Cr package. Apply here.',
    'Phishing email: Your Apple ID has been compromised. Verify now.',
    'Team outing planned for this Saturday. Please confirm attendance.',
    'Fake charity: Donate to earthquake relief - funds go to scammer wallet.',
    'Your password expires in 3 days. Update now to avoid account lock.',
  ];

  const scans = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const cat = categories[Utils.randomBetween(0, categories.length - 1)];
    const sev = cat === 'Safe' ? 'Safe' : severities[Utils.randomBetween(0, severities.length - 1)];
    const scoreRange = riskScores[sev];
    const score = Utils.randomBetween(scoreRange[0], scoreRange[1]);
    const ts = now - Utils.randomBetween(0, 30 * 24 * 60 * 60 * 1000);
    const st = scanTypes[Utils.randomBetween(0, scanTypes.length - 1)];
    const text = sampleTexts[i % sampleTexts.length];

    scans.push({
      id: 'scan_' + Utils.generateId(),
      type: st,
      content: text,
      riskScore: score,
      severity: sev,
      category: cat,
      confidence: Math.min(70 + score * 0.25 + Utils.randomBetween(0, 10), 99),
      timestamp: ts,
      details: {
        reasons: [`${sev === 'Safe' ? 'No' : 'Contains'} suspicious patterns detected`],
        psychologicalTactics: score > 50 ? ['Urgency', 'Fear'] : [],
        recommendation: score > 50 ? 'Do not engage. Delete this message immediately.' : 'This appears to be safe.',
        malwareScore: st === 'File' ? Utils.randomBetween(0, 100) : 0
      }
    });
  }
  scans.sort((a, b) => b.timestamp - a.timestamp);
  return scans;
}

function generateMockPosts(count = 30) {
  const authors = [
    { name: 'CyberShield', avatar: '🛡️', bg: '#6366f1', verified: true },
    { name: 'SafeSurfer', avatar: '🌊', bg: '#06b6d4', verified: true },
    { name: 'TechGuardian', avatar: '⚡', bg: '#22c55e', verified: false },
    { name: 'DigitalDetective', avatar: '🔍', bg: '#f97316', verified: true },
    { name: 'PrivacyPro', avatar: '🔒', bg: '#8b5cf6', verified: false },
    { name: 'ScamWatcher', avatar: '👁️', bg: '#ef4444', verified: true },
    { name: 'NetNinja', avatar: '🥷', bg: '#14b8a6', verified: false },
    { name: 'FirewallQueen', avatar: '👸', bg: '#ec4899', verified: true },
    { name: 'ByteWarden', avatar: '🔐', bg: '#6366f1', verified: false },
    { name: 'DataViking', avatar: '⚔️', bg: '#f97316', verified: true }
  ];
  const threatTags = ['Phishing', 'QR Scam', 'Vishing', 'Investment Scam', 'Fake Job', 'Safety Tip', 'Deepfake', 'Banking', 'Scam Alert', 'Crypto'];
  const postContents = [
    'Just received a convincing phishing email pretending to be from "Amazon Support". The domain was "amaz0n-secure[.]com". Always check the sender address carefully! They asked me to verify my payment method.',
    'Found a tampered QR code at a parking meter today. Someone placed a sticker over the legitimate code. Scanned it with RAKSH and it flagged it as malicious. Always inspect QR codes before scanning!',
    'PSA: New vishing campaign going around. Caller claims to be from "SBI Cyber Crime Department" and asks you to install AnyDesk for "verification". Banks will NEVER ask you to install remote access software. Hang up immediately!',
    'Analyzed a "crypto investment" WhatsApp group. They promise 10% daily returns. Classic Ponzi scheme. The "profit screenshots" are fake. Remember: if it sounds too good to be true, it IS too good to be true.',
    'Quick tip: Use a separate email address for your financial accounts. If one email gets compromised, your bank accounts won\'t be affected. I use different emails for banking, shopping, and social media.',
    'Fake job alert: "Google Work From Home - ₹75,000/month - No experience needed". They ask for a "registration fee" of ₹1,999. Google doesn\'t charge for job applications. Report and block!',
    'My elderly relative almost fell for the "grandson in trouble" scam. Someone called pretending to be me saying they needed bail money. We now have a family safe word. Please talk to your parents about this scam.',
    'New deepfake trend: Scammers are using AI to clone voices from 30 seconds of audio (from social media videos). They called a friend sounding exactly like me asking for money. Terrifying technology.',
    'PSA: Your bank will NEVER send you a link to update KYC via SMS. HDFC, SBI, ICICI customers are being targeted heavily. If in doubt, visit your branch directly.',
    'Spotted a fake Flipkart sale site: flipkart-offer[.]date. The design looked identical but the URL was wrong. Always type the URL yourself instead of clicking links.',
    'Got a call from "FedEx" about a parcel with "illegal items" in my name. They wanted me to pay ₹50,000 as "customs clearance fee". Total scam. Customs contacts you via official letter, not phone calls.',
    'The "your account will be suspended" SMS is back. This time targeting Axis Bank customers. The link goes to a phishing page that steals internet banking credentials. Delete immediately.',
    'Learned something new today: QR codes can be weaponized with something called "QRLJacking". Always use RAKSH to scan QR codes from unknown sources before opening the link.',
    'Warning: Fake IRCTC refund scam is trending. Message says "Your train is cancelled, click here to claim refund". IRCTC never sends refund links via SMS. Check directly on irctc.co.in.',
    'I started using a password manager last month. Best security decision I ever made. 200+ unique passwords now, and I only remember one master password. No more reused passwords!',
    'Deepfake video call scam: My colleague received a video call from "our CEO" asking for an urgent transfer. The AI-generated face and voice were nearly perfect. Always verify through a known phone number.',
    'Telegram scam alert: Fake "crypto signals" groups promising guaranteed profits. They show fake trade screenshots. Once you invest, they block you and disappear. Only invest through SEBI-registered platforms.',
    'Came across a fake internship offer from "Google India" targeting college students. They ask for a "refundable deposit" of ₹5,000 for training materials. No legitimate company charges for internships.',
    'Just achieved 100 safe scans in a row! RAKSH has been my daily companion for checking suspicious messages. My family now sends me every sketchy SMS they receive before clicking anything.',
    'Spotted a clever new phishing technique: Scammers send an email that looks like a bounced email notification. The "delivery failure" link leads to a credential harvesting page. Stay sharp!',
    'Power tip: Set up SMS and email alerts for ALL transactions on your bank accounts. Even ₹1 transactions. Scammers sometimes test with small amounts before a big theft.',
    'Fake WhatsApp Web login page going around. You search for WhatsApp Web and click on a sponsored ad result that leads to a phishing page. Always check the URL before signing in.',
    'My mother received a call from "KYC Department" saying her Aadhaar would be deactivated. They asked her to share a video selfie saying "I authorize". This can be used for face authentication fraud.',
    'New scam: Fake electricity bill payment offers. Message says "Pay ₹1, get ₹500 off on your bill". The link steals your card details. Only pay bills through official apps or portals.',
    'Discovered a fake McDonald\'s survey scam. Receipt says "Complete survey and win free meals for a year". The survey asks for credit card details for "verification". Legitimate surveys never ask for payment info.',
    'The SIM swap nightmare is real. A friend lost ₹2 lakhs when scammers got his number transferred to their SIM and intercepted OTPs. Use app-based authenticators instead of SMS 2FA wherever possible.',
    'PSA: No legitimate company will ever ask you to pay in gift cards. If someone demands payment via Apple/Amazon/Google Play gift cards, it is 100% a scam. Hang up immediately.',
    'Just reported a fake LinkedIn profile to the platform. Scammer was posing as a recruiter from a well-known company and asking candidates for "visa processing fees". Verify recruiters before sharing documents.',
    'Educational institutions beware: New phishing campaign targets college admin staff with fake "UGC grant approval" emails. The attachment contains malware. Verify with official UGC channels.',
    'Tip: I use RAKSH\'s scan feature before opening any link sent via SMS or WhatsApp. The link scanner has saved me from phishing sites at least 15 times this month alone!'
  ];
  const allHashtags = ['phishing', 'banking', 'scam-alert', 'cybersecurity', 'privacy', 'qr-scam', 'deepfake', 'job-scam', 'vishing', 'crypto-scam', 'whatsapp', 'tip', 'security', 'fraud', 'identity-theft', 'social-engineering', 'malware', 'spam', 'awareness', 'safe'];

  const posts = [];
  for (let i = 0; i < count; i++) {
    const author = authors[i % authors.length];
    const tags = [threatTags[i % threatTags.length]];
    const extraTags = allHashtags.sort(() => 0.5 - Math.random()).slice(0, Utils.randomBetween(1, 3));
    const hashtags = [...new Set([...tags.map(t => t.toLowerCase().replace(/\s+/g, '-')), ...extraTags])];
    const timeAgo = Utils.randomBetween(1, 48);
    const likes = Utils.randomBetween(5, 120);
    const reposts = Utils.randomBetween(0, Math.floor(likes / 3));

    posts.push({
      id: 'cp' + (i + 1),
      author: author.name,
      avatar: author.avatar,
      avatarBg: author.bg,
      verified: author.verified,
      time: timeAgo < 60 ? `${timeAgo} min ago` : `${Math.floor(timeAgo / 60)}h ${timeAgo % 60}m ago`,
      threatTag: tags[0],
      content: postContents[i % postContents.length],
      hashtags: hashtags.slice(0, 4),
      likes, reposts,
      comments: Utils.randomBetween(0, 20),
      bookmarked: false
    });
  }
  return posts;
}

function generateMockArticles(count = 50) {
  const articles = [
    { category: 'Scam Awareness', title: 'How to Identify Phishing Emails', excerpt: 'Phishing emails are designed to trick you into revealing sensitive information...', content: 'Phishing emails often create a sense of urgency, use generic greetings, and contain suspicious links. Always verify the sender email address, look for spelling mistakes, and never click on links directly. Legitimate companies never ask for passwords or OTPs via email.', bookmarkable: true },
    { category: 'Scam Awareness', title: 'Spotting Fake SMS Messages', excerpt: 'Fake SMS messages, or "smishing," use urgent language and fake links...', content: 'Smishing attacks use SMS to deliver phishing links. Common tactics include fake delivery notifications, bank alerts, and prize winnings. Never click links in unsolicited SMS messages. Verify through official channels.', bookmarkable: true },
    { category: 'Scam Awareness', title: 'Social Engineering Red Flags', excerpt: 'Social engineers manipulate human psychology to gain access to sensitive information...', content: 'Social engineering attacks exploit trust, fear, and urgency. Common tactics include impersonation, pretexting, baiting, and tailgating. Always verify identities through independent channels before sharing information.', bookmarkable: true },
    { category: 'Scam Awareness', title: 'The Psychology Behind Scams', excerpt: 'Scammers use psychological tactics to bypass your rational thinking...', content: 'Scammers exploit cognitive biases: urgency (time pressure), authority (pretending to be officials), social proof (fake testimonials), and scarcity (limited offers). Understanding these tactics helps you recognize scams before falling for them.', bookmarkable: true },
    { category: 'Scam Awareness', title: 'Common Scam Phrases to Watch For', excerpt: 'Certain phrases are red flags that indicate a scam...', content: '"Act now," "limited time offer," "you won," "verify your account," "payment required," "free gift," "exclusive deal," "guaranteed returns." If you see these in unsolicited messages, be suspicious.', bookmarkable: false },
    { category: 'Banking Fraud', title: 'Protecting Against Banking Fraud', excerpt: 'Banking scams are becoming increasingly sophisticated with AI-powered social engineering...', content: 'Never share your OTP, PIN, or CVV with anyone. Banks never call asking for these details. Use only official banking apps and websites. Enable transaction alerts and set daily limits.', bookmarkable: true },
    { category: 'Banking Fraud', title: 'Understanding UPI Fraud', excerpt: 'UPI frauds are on the rise. Learn how scammers trick you into approving payments...', content: 'UPI fraud includes fake payment requests, QR code scams, and phishing UPI links. Never approve a payment request unless you initiated it. Check the UPI ID before sending money.', bookmarkable: true },
    { category: 'Banking Fraud', title: 'Credit Card Fraud Prevention', excerpt: 'Tips to keep your credit card safe from online and offline fraud...', content: 'Use virtual cards for online transactions, enable SMS alerts for all transactions, never save card details on shopping sites, use 3D Secure for online payments, and review statements monthly.', bookmarkable: true },
    { category: 'Banking Fraud', title: 'How SIM Swap Attacks Work', excerpt: 'SIM swapping is a serious threat that can bypass SMS-based two-factor authentication...', content: 'Scammers trick mobile carriers into transferring your number to a new SIM. Once they have your number, they can intercept OTPs and access your accounts. Use app-based authenticators like Google Authenticator instead.', bookmarkable: true },
    { category: 'Banking Fraud', title: 'Safe Net Banking Practices', excerpt: 'Essential habits for secure online banking...', content: 'Always type your bank URL manually. Never use public Wi-Fi for banking. Log out after each session. Use a dedicated device for financial transactions. Enable biometric authentication.', bookmarkable: false },
    { category: 'Banking Fraud', title: 'ATM Skimming Detection', excerpt: 'How to spot card skimmers at ATMs and payment terminals...', content: 'Check for loose or misaligned card readers, unusual keypad overlays, and hidden cameras. Cover the keypad when entering PIN. Use contactless payments where possible.', bookmarkable: true },
    { category: 'Investment Scams', title: 'Spotting Fake Investment Opportunities', excerpt: 'If it sounds too good to be true, it probably is...', content: 'Fake investment schemes promise guaranteed high returns with no risk. They use pressure tactics like "limited time offer." Always verify companies with SEBI registration.', bookmarkable: true },
    { category: 'Investment Scams', title: 'Cryptocurrency Scams Uncovered', excerpt: 'Crypto scams range from fake exchanges to Ponzi schemes...', content: 'Common crypto scams: fake exchanges, Ponzi schemes, rug pulls, phishing wallets, and social media giveaways. Only use registered exchanges and never share your private keys.', bookmarkable: true },
    { category: 'Investment Scams', title: 'Ponzi vs Pyramid Schemes', excerpt: 'Understanding the difference and how to avoid both...', content: 'Ponzi schemes pay returns to early investors using new investors money. Pyramid schemes require recruitment. Both collapse when new investors dry up. Legitimate investments generate real value.', bookmarkable: true },
    { category: 'Investment Scams', title: 'Fake Trading Platforms', excerpt: 'Fake trading apps and websites that steal your investment...', content: 'Scammers create realistic trading platforms that show fake profits. When you try to withdraw, they demand "tax" or "processing fees." Only use SEBI-registered brokers and trading platforms.', bookmarkable: true },
    { category: 'QR Scams', title: 'QR Code Scams: What to Watch For', excerpt: 'Fake QR codes can lead to malicious websites or payment fraud...', content: 'QR codes can be tampered with by placing stickers over legitimate codes. Before scanning, check if the QR code sticker looks suspicious or misaligned. Use RAKSH\'s QR scanner to verify links.', bookmarkable: true },
    { category: 'QR Scams', title: 'Safe QR Scanning Practices', excerpt: 'How to scan QR codes safely in public places...', content: 'Always check if a QR sticker is placed over the original. Verify the destination URL before opening. Never make payments through unknown QR codes. Use a QR scanner that shows the URL before opening.', bookmarkable: true },
    { category: 'QR Scams', title: 'QRLJacking Explained', excerpt: 'QRLJacking is a sophisticated QR code attack vector...', content: 'QRLJacking tricks users into scanning a malicious QR code that hijacks their web session. This can compromise WhatsApp Web, Telegram, and other services. Always verify QR code sources.', bookmarkable: true },
    { category: 'Fake Jobs', title: 'Avoiding Job Offer Scams', excerpt: 'Fake job offers are used to steal personal information and money...', content: 'Legitimate companies never ask for money for job applications, training, or visa processing. Be suspicious of offers without proper interviews. Verify company domains.', bookmarkable: true },
    { category: 'Fake Jobs', title: 'Work From Home Scams', excerpt: '"Earn money from home" offers that are actually scams...', content: 'WFH scams promise high income for minimal work. They may ask for "registration fees" or "training costs." Legitimate WFH jobs are posted on official company career pages with proper interview processes.', bookmarkable: true },
    { category: 'Fake Jobs', title: 'Fake Recruitment on LinkedIn', excerpt: 'Scammers impersonate recruiters on professional networks...', content: 'Fake recruiters create convincing profiles mimicking real company employees. They ask for passport copies, bank details, and fees. Verify recruiters through official company channels.', bookmarkable: true },
    { category: 'Fake Jobs', title: 'Freelance Platform Scams', excerpt: 'Scams targeting freelancers on Upwork, Fiverr, and similar platforms...', content: 'Scammers offer well-paying projects, then ask for "registration fees" or send fake payment confirmations. Legitimate clients on freelance platforms do not ask for upfront payments.', bookmarkable: false },
    { category: 'AI Scams', title: 'AI-Powered Scams: The New Frontier', excerpt: 'AI is being used to create convincing deepfakes, voice clones, and chatbots...', content: 'AI scams include deepfake video calls, voice cloning to impersonate family members, and AI-generated phishing emails. Be cautious even with voice/video calls requesting money.', bookmarkable: true },
    { category: 'AI Scams', title: 'Deepfake Voice Cloning', excerpt: 'How scammers clone voices using just seconds of audio...', content: 'AI voice cloning needs only 30 seconds of audio (from social media videos). Scammers call sounding exactly like your family member asking for money. Set up a family safe word for verification.', bookmarkable: true },
    { category: 'AI Scams', title: 'Deepfake Video Call Scams', excerpt: 'Real-time deepfake video calls used in corporate fraud...', content: 'Advanced AI can now generate real-time fake video feeds. CEOs have been impersonated to authorize fraudulent wire transfers. Always verify urgent financial requests through a separate channel.', bookmarkable: true },
    { category: 'AI Scams', title: 'AI-Generated Phishing Emails', excerpt: 'ChatGPT and similar tools make phishing emails nearly perfect...', content: 'AI-generated phishing emails have perfect grammar, personalization, and convincing context. Traditional red flags like poor spelling are disappearing. Use AI detection tools like RAKSH to analyze messages.', bookmarkable: true },
    { category: 'Crypto Scams', title: 'Common Cryptocurrency Scams', excerpt: 'Overview of the most prevalent crypto scams in 2026...', content: 'Rug pulls, pump-and-dump schemes, fake airdrops, phishing wallets, and fake exchanges are common. Never invest based on social media hype. Use reputable exchanges and cold storage.', bookmarkable: true },
    { category: 'Crypto Scams', title: 'Fake Crypto Wallets', excerpt: 'Malicious wallet apps that steal your cryptocurrency...', content: 'Fake wallet apps on app stores look identical to legitimate ones. They steal your private keys when you create a wallet. Always verify the developer and download count before installing.', bookmarkable: true },
    { category: 'Crypto Scams', title: 'NFT and Metaverse Scams', excerpt: 'Scams in the NFT and virtual real estate markets...', content: 'Fake NFT drops, phishing links to "mint" NFTs, and fake metaverse land sales are common. Only buy from official marketplaces. Never connect your wallet to unknown sites.', bookmarkable: false },
    { category: 'Identity Theft', title: 'Preventing Identity Theft Online', excerpt: 'Identity theft can damage your credit and reputation...', content: 'Use strong, unique passwords for every account. Enable two-factor authentication wherever possible. Monitor your credit reports regularly. Shred documents containing personal information.', bookmarkable: true },
    { category: 'Identity Theft', title: 'Protecting Your Aadhaar Number', excerpt: 'How to safely use your Aadhaar without risking identity theft...', content: 'Use masked Aadhaar when possible. Never share OTP sent to Aadhaar-linked mobile. Verify any request for Aadhaar copy. Use Aadhaar virtual ID instead of sharing your actual number.', bookmarkable: true },
    { category: 'Identity Theft', title: 'Social Media Privacy Settings', excerpt: 'Configure your social media accounts to minimize identity theft risk...', content: 'Limit public profile information. Disable location tagging. Review tagged photos. Use private accounts. Be cautious about sharing birth dates, addresses, and vacation plans publicly.', bookmarkable: true },
    { category: 'Identity Theft', title: 'Data Breach Response Guide', excerpt: 'What to do when your data is compromised in a breach...', content: 'Change passwords immediately. Enable 2FA. Check for unauthorized transactions. Freeze your credit report if financial data was leaked. Monitor accounts for suspicious activity for 12+ months.', bookmarkable: true },
    { category: 'Security Guides', title: '10 Essential Security Practices', excerpt: 'Simple habits that dramatically improve your digital security...', content: '1. Use a password manager\n2. Enable 2FA on all accounts\n3. Keep software updated\n4. Don\'t reuse passwords\n5. Verify before clicking\n6. Use encrypted messaging\n7. Regular backups\n8. Lock your devices\n9. Check privacy settings\n10. Trust your instincts', bookmarkable: true },
    { category: 'Security Guides', title: 'Creating Strong Passwords', excerpt: 'How to create and manage secure passwords...', content: 'Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols. Avoid dictionary words, personal information, or common patterns. Use a password manager to generate and store them.', bookmarkable: true },
    { category: 'Security Guides', title: 'Two-Factor Authentication Guide', excerpt: 'Why 2FA matters and how to set it up correctly...', content: '2FA adds a second layer of security beyond passwords. App-based authenticators (Google Authenticator, Authy) are more secure than SMS. Avoid using SMS 2FA where possible due to SIM swap risks.', bookmarkable: true },
    { category: 'Security Guides', title: 'Securing Your Home Wi-Fi', excerpt: 'Protect your home network from intruders...', content: 'Change default router password, enable WPA3 encryption, disable WPS, update firmware regularly, use a guest network for visitors, and consider a VPN for sensitive activities.', bookmarkable: true },
    { category: 'Security Guides', title: 'Mobile Device Security', excerpt: 'Keep your smartphone safe from malware and theft...', content: 'Keep OS updated, install apps only from official stores, review app permissions, enable remote wipe, use biometric lock, avoid sideloading apps, and encrypt your device storage.', bookmarkable: false },
    { category: 'Security Guides', title: 'Email Security Best Practices', excerpt: 'Protect your email account from compromise...', content: 'Use a strong unique password, enable 2FA, beware of phishing, use aliases for different services, enable IMAP/POP3 only when needed, and check forwarding rules regularly for unauthorized changes.', bookmarkable: true },
    { category: 'Security Guides', title: 'Safe Online Shopping', excerpt: 'How to shop online without getting scammed...', content: 'Shop only from reputable sites, check for HTTPS, use credit cards (better fraud protection), avoid debit cards for online purchases, keep receipts, and monitor statements for unauthorized charges.', bookmarkable: true },
    { category: 'Security Guides', title: 'Public Wi-Fi Safety', excerpt: 'Stay safe when using public Wi-Fi networks...', content: 'Avoid accessing sensitive accounts on public Wi-Fi. Use a VPN for encryption. Disable file sharing. Turn off Wi-Fi auto-connect. Use mobile hotspot for banking transactions.', bookmarkable: false },
    { category: 'Delivery Scams', title: 'Fake Delivery Notifications', excerpt: 'How to spot fake courier delivery messages...', content: 'Fake delivery SMS messages ask you to click a link to "reschedule" or "track" your package. These links lead to phishing sites. If you\'re not expecting a package, delete the message.', bookmarkable: true },
    { category: 'Delivery Scams', title: 'Customs Clearance Phone Scam', excerpt: 'Fake customs calls demanding payment for parcel clearance...', content: 'Scammers call pretending to be from customs, claiming a parcel addressed to you contains illegal items. They demand payment to avoid legal action. Customs communicates via official letters, not phone calls.', bookmarkable: true },
    { category: 'Delivery Scams', title: 'Parcel Tracking Phishing', excerpt: 'Fake tracking links that steal your personal data...', content: 'Scammers send fake tracking links via SMS or email. The tracking page looks legitimate but captures your login credentials and personal information. Always use the official courier website.', bookmarkable: false },
    { category: 'OTP Fraud', title: 'How OTP Frauds Work', excerpt: 'OTP frauds trick you into sharing your one-time password with scammers...', content: 'Scammers call pretending to be bank representatives and ask for your OTP "for verification." Some use SIM swapping to intercept your OTPs. Never share OTPs with anyone.', bookmarkable: true },
    { category: 'OTP Fraud', title: 'SIM Swap + OTP Interception', excerpt: 'How SIM swapping enables OTP theft and account takeover...', content: 'Scammers get your number transferred to their SIM, then intercept all your OTPs. They can drain bank accounts, reset passwords, and take over social media. Use app-based 2FA to protect against this.', bookmarkable: true },
    { category: 'OTP Fraud', title: 'OTP Forwarding Malware', excerpt: 'Malware that forwards your OTP SMS to scammers...', content: 'Some Android malware requests SMS permission to forward OTP messages to scammers. It hides its icon after installation. Review app permissions regularly and avoid installing apps from unknown sources.', bookmarkable: true },
    { category: 'Tech Support', title: 'Fake Tech Support Calls', excerpt: 'How to handle unsolicited tech support calls...', content: 'Microsoft, Apple, and other tech companies never call about computer issues. Scammers claim your computer has a virus and request remote access. They will "find" problems and charge for fixes. Hang up immediately.', bookmarkable: true },
    { category: 'Tech Support', title: 'Pop-Up Tech Support Scams', excerpt: 'Fake virus warnings in your browser that lead to tech support scams...', content: 'Malicious advertisements create full-screen browser warnings saying "Virus Detected - Call Support Now." These pop-ups try to lock your browser. Close the tab or restart your browser. Do not call the number.', bookmarkable: true },
    { category: 'Tech Support', title: 'Remote Access Scams', excerpt: 'Scammers using remote desktop tools to steal your data...', content: 'Scammers ask you to install AnyDesk, TeamViewer, or similar tools. Once connected, they can access files, passwords, and bank accounts. Never give remote access to anyone who calls you unsolicited.', bookmarkable: true },
    { category: 'WhatsApp Scams', title: 'WhatsApp Verification Code Scam', excerpt: 'How scammers take over your WhatsApp account...', content: 'Scammers trigger WhatsApp verification to your number, then call pretending to be support asking for the 6-digit code. Never share this code. Enable two-step verification in WhatsApp settings.', bookmarkable: true },
    { category: 'WhatsApp Scams', title: 'Fake WhatsApp Group Scams', excerpt: 'Investment and shopping scams spreading through WhatsApp groups...', content: 'You are added to a WhatsApp group promising easy money or amazing deals. The group has hundreds of fake members and fake success stories. Leave the group and block the admin.', bookmarkable: true },
    { category: 'WhatsApp Scams', title: 'WhatsApp Spoofing Attacks', excerpt: 'Scammers spoofing WhatsApp messages pretending to be your contacts...', content: 'Scammers can spoof WhatsApp messages to appear as if they come from your contacts. They ask for money or OTPs. If a friend\'s message seems unusual, verify through another channel.', bookmarkable: false },
    { category: 'Social Media', title: 'Instagram Phishing Scams', excerpt: 'Fake Instagram login pages and giveaway scams...', content: 'Scammers create fake Instagram login pages and send them via DM. "Your account will be deleted" or "You won a giveaway" are common lures. Enable 2FA and never click login links from DMs.', bookmarkable: true },
    { category: 'Social Media', title: 'Facebook Marketplace Scams', excerpt: 'How to avoid scams when buying/selling on Facebook Marketplace...', content: 'Beware of fake payment confirmations, overpayment scams, and advance-fee fraud. Meet in person for cash transactions. Use platform payment systems with buyer protection.', bookmarkable: false },
    { category: 'Social Media', title: 'Telegram Scam Bots', excerpt: 'Fake Telegram bots designed to steal your crypto and data...', content: 'Scammers create convincing Telegram bots that promise airdrops, trading signals, or premium content. These bots ask for private keys or wallet connections. Only use verified bots from official sources.', bookmarkable: true }
  ];

  return articles.slice(0, count).map((a, i) => ({
    id: 'ka' + (i + 1),
    ...a
  }));
}

function generateMockConversations(count = 20) {
  const titles = [
    'Phishing email analysis', 'Banking SMS - is it fake?', 'Suspicious QR code on menu',
    'Job offer from Google?', 'Crypto investment check', 'Delivery SMS - legit or scam?',
    'WhatsApp verification code', 'Deepfake voice call', 'KYC update request',
    'Lottery winning message', 'Fake Amazon order confirmation', 'LinkedIn recruiter scam',
    'Insurance policy renewal', 'UPI payment request', 'Fake Netflix subscription',
    'Electricity bill scam', 'IRCTC refund SMS', 'SIM swap concerns',
    'Credit card fraud alert', 'Aadhaar-PAN linking scam'
  ];
  const conversations = [];
  for (let i = 0; i < count; i++) {
    const msgCount = Utils.randomBetween(2, 8);
    const messages = [];
    for (let j = 0; j < msgCount; j++) {
      messages.push({
        role: j % 2 === 0 ? 'user' : 'ai',
        text: j % 2 === 0 ? `Message ${j + 1} content about ${titles[i].toLowerCase()}` : `AI analysis response for message ${j + 1}`,
        timestamp: Date.now() - (msgCount - j) * 60000
      });
    }
    conversations.push({
      id: 'conv_' + Utils.generateId(),
      title: titles[i],
      messages,
      createdAt: Date.now() - Utils.randomBetween(1, 30) * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
      pinned: false,
      favorite: false
    });
  }
  return conversations;
}

function generateMockNotifications(count = 30) {
  const items = [
    { title: 'No threats detected in your latest scan.', text: 'Your most recent scan completed without any suspicious findings.', type: 'safe' },
    { title: 'Suspicious link detected. Review before opening.', text: 'A recently scanned URL matched known phishing indicators and should be reviewed carefully.', type: 'warning' },
    { title: 'Potential phishing attempt detected.', text: 'RAKSH flagged a high-risk message that impersonates a trusted service.', type: 'critical' },
    { title: 'Protection database updated successfully.', text: 'The latest threat signatures and detection rules were applied successfully.', type: 'info' },
    { title: 'Connected Apps settings have been updated.', text: 'Your connected app preferences were saved and synced to your profile.', type: 'system' },
    { title: 'Unusual sign-in detected from a new device.', text: 'A recent login attempt came from a device not previously recognized.', type: 'warning' },
    { title: 'All systems are operating normally.', text: 'No further action is required at this time.', type: 'safe' },
    { title: 'Weekly security report is ready.', text: 'A summary of recent scans and threats is available for review.', type: 'system' },
    { title: 'Malicious attachment blocked.', text: 'A suspicious file upload was intercepted before it could be opened.', type: 'critical' },
    { title: 'AI Assistant guidance refreshed.', text: 'The assistant now includes the latest scam awareness examples.', type: 'info' }
  ];

  const notifs = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const item = items[i % items.length];
    notifs.push({
      id: 'notif_' + Utils.generateId(),
      title: item.title,
      text: item.text,
      type: item.type,
      read: i > count * 0.6,
      timestamp: now - Utils.randomBetween(0, 14) * 24 * 60 * 60 * 1000
    });
  }
  notifs.sort((a, b) => b.timestamp - a.timestamp);
  return notifs;
}

const MockData = {
  scans: generateMockScans(50),
  posts: generateMockPosts(30),
  articles: generateMockArticles(50),
  conversations: generateMockConversations(20),
  notifications: generateMockNotifications(50)
};

const AIEngine = {
  analyzeText(text) {
    if (!text || !text.trim()) {
      return { riskScore: 0, confidence: 0, category: 'None', severity: 'Safe', reasons: [], recommendation: 'No content to analyze.' };
    }

    const content = text.toLowerCase();
    let score = 0;
    const reasons = [];
    const tactics = [];
    let category = 'Safe';
    let maxCategoryScore = 0;

    const patterns = [
      { words: ['urgent', 'immediately', 'act now', 'limited time', 'expires'], score: 15, tactic: 'Urgency', category: 'Urgency Scam' },
      { words: ['you won', 'congratulations', 'prize', 'winner', 'lottery', 'gift card'], score: 20, tactic: 'Prize/Lottery', category: 'Prize Scam' },
      { words: ['bank', 'account', 'credit card', 'debit card', 'payment', 'transaction', 'sbi', 'hdfc', 'icici'], score: 15, tactic: 'Financial', category: 'Banking Scam' },
      { words: ['bitcoin', 'crypto', 'investment', 'profit', 'return', 'dividend', 'token'], score: 18, tactic: 'Investment', category: 'Investment Scam' },
      { words: ['support', 'help desk', 'customer care', 'technical support', 'refund'], score: 12, tactic: 'Fake Support', category: 'Tech Support Scam' },
      { words: ['password', 'otp', 'verify', 'account suspended', 'login', 'credential'], score: 20, tactic: 'Credential Theft', category: 'Phishing' },
      { words: ['free', 'click here', 'subscribe', 'offer', 'discount', 'exclusive'], score: 8, tactic: 'Bait', category: 'Spam' },
      { words: ['insurance', 'claim', 'policy', 'premium', 'loan'], score: 10, tactic: 'Insurance', category: 'Insurance Scam' },
      { words: ['job', 'work from home', 'part time', 'earn money', 'income'], score: 12, tactic: 'Fake Job', category: 'Job Scam' },
      { words: ['delivery', 'courier', 'package', 'shipment', 'tracking', 'parcel'], score: 10, tactic: 'Delivery', category: 'Delivery Scam' },
      { words: ['kYC', 'update', 'verification', 'document'], score: 14, tactic: 'KYC Fraud', category: 'Identity Theft' },
      { words: ['whatsapp', 'telegram', 'signal', 'messenger'], score: 6, tactic: 'Messaging', category: 'Social Engineering' }
    ];

    for (const pattern of patterns) {
      const found = pattern.words.filter(w => content.includes(w));
      if (found.length > 0) {
        const matchScore = pattern.score * (found.length / pattern.words.length);
        score += matchScore;
        if (matchScore > maxCategoryScore) {
          maxCategoryScore = matchScore;
          category = pattern.category;
        }
        reasons.push(`Contains suspicious ${pattern.tactic.toLowerCase()} keywords: "${found.slice(0, 3).join(', ')}"`);
        tactics.push(pattern.tactic);
      }
    }

    const urlCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 2) {
      score += 10;
      reasons.push(`Contains ${urlCount} URLs, which may be phishing links`);
      tactics.push('Multiple Links');
    } else if (urlCount > 0) {
      score += 5;
      reasons.push('Contains URL links that should be verified');
    }

    const phoneCount = (text.match(/[\+]?\d{10,13}/g) || []).length;
    if (phoneCount > 0) {
      score += 5;
      reasons.push(`Contains phone number(s) - scammers often request callbacks`);
    }

    const capsRatio = text.replace(/[^A-Z]/g, '').length / Math.max(text.length, 1);
    if (capsRatio > 0.4 && text.length > 20) {
      score += 8;
      reasons.push('Excessive capitalization detected - emotional manipulation tactic');
      tactics.push('Emotional Manipulation');
    }

    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      score += 5;
      reasons.push('Multiple exclamation marks - urgency manipulation');
    }

    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 3) {
      score += 3;
      reasons.push('Multiple questions - probing for personal information');
    }

    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount > 3) {
      score += 4;
      reasons.push(`Repeated emojis (${emojiCount}) - emotional manipulation`);
      tactics.push('Emotional Manipulation');
    }

    const suspiciousTLDs = ['.xyz', '.top', '.club', '.win', '.bid', '.download', '.review', '.work', '.date', '.racing'];
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];
    for (const url of urls) {
      const tld = url.match(/\.([a-z]{2,})(?:\/|$)/);
      if (tld && suspiciousTLDs.includes(tld[0])) {
        score += 10;
        reasons.push(`URL uses suspicious TLD "${tld[0]}" - common in phishing sites`);
      }
      if (url.includes('tinyurl') || url.includes('bit.ly') || url.includes('shorturl') || url.includes('rb.gy') || url.includes('short')) {
        score += 6;
        reasons.push('URL uses a link shortener - may hide malicious destination');
      }
    }

    const urgencyWords = ['today only', 'last chance', 'don\'t miss', 'expires', 'deadline', 'immediate action', 'hurry', 'limited', 'final warning'];
    const urgencyFound = urgencyWords.filter(w => content.includes(w));
    if (urgencyFound.length > 0) {
      score += 10;
      reasons.push(`Urgency manipulation detected: "${urgencyFound.join(', ')}"`);
      tactics.push('Urgency');
    }

    const fearWords = ['suspended', 'blocked', 'terminated', 'legal action', 'fraud alert', 'security breach', 'compromised', 'unauthorized'];
    const fearFound = fearWords.filter(w => content.includes(w));
    if (fearFound.length > 0) {
      score += 12;
      reasons.push(`Fear tactics detected: "${fearFound.join(', ')}"`);
      tactics.push('Fear');
    }

    score = Math.min(score, 100);

    const confidence = Math.min(70 + score * 0.3 + Math.random() * 5, 99);
    const severity = Utils.getSeverity(score);
    const uniqueTactics = [...new Set(tactics)];

    const recommendations = {
      'Safe': 'No immediate concerns detected. Always stay vigilant with unknown messages.',
      'Low': 'Minor concerns detected. Exercise caution and verify if something feels off.',
      'Medium': 'Moderate risk detected. Do not respond or click any links. Verify through official channels.',
      'High': 'High risk of scam. Do not engage. Delete the message immediately. Report to concerned authorities.',
      'Critical': 'Critical threat detected. Do not interact. Delete immediately. Contact your bank if financial info is involved. Report to cyber crime portal.'
    };

    if (reasons.length === 0) {
      reasons.push('No suspicious patterns detected in the content');
      reasons.push('Message appears to be legitimate based on current analysis');
    }

    const similarScams = this.getSimilarScams(category, score);
    const detectedKeywords = patterns
      .filter(p => p.words.some(w => content.includes(w)))
      .flatMap(p => p.words.filter(w => content.includes(w)))
      .slice(0, 8);

    const learningResource = this.getLearningResource(category);

    return {
      riskScore: Math.round(score),
      confidence: Math.round(confidence),
      category: category,
      severity: severity.label,
      severityClass: severity.class,
      severityColor: severity.color,
      reasons: reasons.slice(0, 8),
      psychologicalTactics: uniqueTactics,
      detectedKeywords: [...new Set(detectedKeywords)],
      similarScamPattern: similarScams,
      learningResource: learningResource,
      recommendation: recommendations[severity.label] || recommendations.Medium
    };
  },

  analyzeURL(url) {
    if (!url || !url.trim()) {
      return { riskScore: 0, confidence: 0, category: 'None', severity: 'Safe', reasons: [], recommendation: 'No URL to analyze.' };
    }

    let score = 0;
    const reasons = [];

    if (url.length > 75) {
      score += 10;
      reasons.push('URL is unusually long - may hide malicious parameters');
    }

    const suspiciousTLDs = ['.xyz', '.top', '.club', '.win', '.bid', '.download', '.review', '.work', '.date', '.racing', '.click', '.loan', '.men'];
    const tldMatch = url.match(/\.([a-z]{2,})(?:\/|$)/);
    if (tldMatch && suspiciousTLDs.includes(tldMatch[0])) {
      score += 20;
      reasons.push(`Suspicious TLD "${tldMatch[0]}" - commonly used by phishing sites`);
    }

    const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    if (ipPattern.test(url)) {
      score += 25;
      reasons.push('URL uses IP address instead of domain name - common in phishing');
    }

    const shorteners = ['bit.ly', 'tinyurl', 'tiny.cc', 'rb.gy', 'shorturl', 'shorte', 'shortened', 'ow.ly', 'is.gd', 'buff.ly', 'goo.gl', 't.co', 'rebrand.ly'];
    if (shorteners.some(s => url.includes(s))) {
      score += 15;
      reasons.push('URL uses link shortener - destination is hidden');
    }

    const redirectCount = (url.match(/[?&](redirect|url=|link=|next=|to=|goto=|target=)/gi) || []).length;
    if (redirectCount > 0) {
      score += 15;
      reasons.push(`URL contains ${redirectCount} redirect parameter(s) - may lead to malicious site`);
    }

    const mixedChars = url.match(/([a-z][A-Z])|([A-Z][a-z])/g);
    if (mixedChars && mixedChars.length > 5) {
      score += 8;
      reasons.push('Mixed character casing detected - may impersonate legitimate URLs');
    }

    const homoglyphs = /[а-яА-Я]/;
    if (homoglyphs.test(url)) {
      score += 20;
      reasons.push('URL contains Cyrillic characters that look like Latin letters - homoglyph attack');
    }

    const suspiciousKeywords = ['login', 'verify', 'update', 'secure', 'account', 'confirm', 'password', 'reset', 'authenticate', 'banking', 'signin'];
    const foundKeywords = suspiciousKeywords.filter(k => url.toLowerCase().includes(k));
    if (foundKeywords.length > 0) {
      score += 10;
      reasons.push(`URL contains suspicious keywords: "${foundKeywords.join(', ')}" - impersonation attempt`);
    }

    const dashCount = (url.match(/-/g) || []).length;
    if (dashCount > 3) {
      score += 5;
      reasons.push('Multiple hyphens in domain - may impersonate legitimate sites');
    }

    score = Math.min(score, 100);
    const confidence = Math.min(70 + score * 0.3, 98);
    const severity = Utils.getSeverity(score);

    const recommendations = {
      'Safe': 'URL appears safe. Standard precautions still apply.',
      'Low': 'Minor concerns. Verify the destination before visiting.',
      'Medium': 'Suspicious URL detected. Do not click without thorough verification.',
      'High': 'High risk URL. Likely a phishing or malicious site. Do not visit.',
      'Critical': 'Critical - This URL is almost certainly malicious. Block immediately.'
    };

    if (reasons.length === 0) {
      reasons.push('URL structure appears normal');
      reasons.push('No suspicious patterns detected');
    }

    return {
      riskScore: Math.round(score),
      confidence: Math.round(confidence),
      category: score > 50 ? 'Malicious URL' : 'Legitimate URL',
      severity: severity.label,
      severityClass: severity.class,
      severityColor: severity.color,
      reasons: reasons.slice(0, 8),
      psychologicalTactics: score > 40 ? ['Deception', 'Impersonation'] : [],
      similarScamPattern: score > 50 ? 'Phishing URL - Impersonation Attack' : 'No known pattern',
      recommendation: recommendations[severity.label] || recommendations.Medium
    };
  },

  analyzeFile(filename, filesize) {
    let score = 0;
    const reasons = [];
    const ext = filename?.split('.').pop()?.toLowerCase() || '';

    const highRiskExts = ['exe', 'msi', 'bat', 'cmd', 'vbs', 'ps1', 'scr', 'jar', 'dll'];
    const mediumRiskExts = ['zip', 'rar', '7z', 'docm', 'xlsm', 'pptm'];

    if (highRiskExts.includes(ext)) {
      score += 30;
      reasons.push(`Executable file (.${ext}) - high risk of malware`);
    } else if (mediumRiskExts.includes(ext)) {
      score += 15;
      reasons.push(`Archive/macro-enabled file (.${ext}) - may contain malicious content`);
    } else if (['pdf'].includes(ext)) {
      score += 8;
      reasons.push('PDF files can contain malicious scripts or embedded links');
    } else if (['docx', 'xlsx', 'pptx'].includes(ext)) {
      score += 5;
      reasons.push('Office documents may contain macros or embedded objects');
    }

    if (filesize > 10 * 1024 * 1024) {
      score += 10;
      reasons.push(`Large file size (${Utils.formatBytes(filesize)}) - unusual for this type`);
    } else if (filesize > 50 * 1024 * 1024) {
      score += 20;
      reasons.push('Very large file - potential risk of bundled malware');
    }

    if (filesize < 1024 && !['txt', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) {
      score += 5;
      reasons.push('File seems too small for its type - may be corrupted or tampered');
    }

    score = Math.min(score, 100);
    const confidence = Math.min(70 + score * 0.25, 95);
    const severity = Utils.getSeverity(score);

    const malwareScore = Math.min(score + Utils.randomBetween(-10, 10), 100);

    return {
      riskScore: Math.round(score),
      confidence: Math.round(confidence),
      malwareScore: Math.max(0, Math.round(malwareScore)),
      category: score > 50 ? 'Malicious File' : 'Legitimate File',
      severity: severity.label,
      severityClass: severity.class,
      severityColor: severity.color,
      reasons: reasons.length ? reasons.slice(0, 6) : ['No suspicious characteristics detected'],
      psychologicalTactics: [],
      similarScamPattern: score > 50 ? 'Malware Distribution' : 'No known pattern',
      recommendation: score > 50 ? 'Do not open this file. Delete it immediately and run a full antivirus scan.' : 'File appears safe. Standard precautions still apply.',
      fileInfo: {
        name: filename,
        size: Utils.formatBytes(filesize),
        type: Utils.detectFileType(filename),
        extension: ext.toUpperCase()
      }
    };
  },

  getLearningResource(category) {
    const resources = {
      'Phishing': { title: 'How to Identify Phishing Emails', url: 'protection.html' },
      'Banking Scam': { title: 'Protecting Against Banking Fraud', url: 'protection.html' },
      'Prize Scam': { title: 'Spotting Fake Lottery and Prize Scams', url: 'protection.html' },
      'Investment Scam': { title: 'Avoiding Fake Investment Schemes', url: 'protection.html' },
      'Tech Support Scam': { title: 'Tech Support Scams: What to Watch For', url: 'protection.html' },
      'Job Scam': { title: 'Avoiding Job Offer Scams', url: 'protection.html' },
      'Delivery Scam': { title: 'Delivery Scams: Don\'t Get Tricked', url: 'protection.html' },
      'Identity Theft': { title: 'Preventing Identity Theft Online', url: 'protection.html' },
      'Social Engineering': { title: 'How Social Engineering Attacks Work', url: 'protection.html' },
      'QR Scam': { title: 'QR Code Scams: What to Watch For', url: 'protection.html' }
    };
    return resources[category] || null;
  },

  getSimilarScams(category, score) {
    const patterns = {
      'Phishing': 'Credential harvesting via fake login pages',
      'Banking Scam': 'Bank impersonation to steal financial credentials',
      'Prize Scam': 'Advance-fee fraud promising fake winnings',
      'Investment Scam': 'Ponzi-like schemes promising unrealistic returns',
      'Tech Support Scam': 'Fake technical support demanding remote access',
      'Job Scam': 'Fake employment offers requesting registration fees',
      'Delivery Scam': 'Fake delivery notifications with phishing links',
      'Identity Theft': 'KYC fraud attempting to collect identity documents',
      'Social Engineering': 'Psychological manipulation to extract information',
      'Urgency Scam': 'Time-pressure tactics to bypass rational thinking',
      'Insurance Scam': 'Fake insurance claims and policy fraud'
    };
    return patterns[category] || 'Unknown pattern';
  },

  getAIResponse(query) {
    const q = query.toLowerCase();
    for (const item of DATA.aiResponses) {
      if (item.keywords.some(k => q.includes(k))) {
        return item.response;
      }
    }
    const responses = [
      'I analyze messages, links, and files for scam indicators. Paste a suspicious message or share a link, and I\'ll tell you if it\'s safe.',
      'To get the best analysis, please share the exact message or link you\'re concerned about. I can check for phishing, fraud, and other threats.',
      'I\'m your AI security guardian. I can help identify scams, explain phishing, check URLs, and more. What would you like me to analyze?',
      'Stay safe online! If you\'ve received a suspicious message, link, or file, share it with me and I\'ll run a comprehensive security analysis.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

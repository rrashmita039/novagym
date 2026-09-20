require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');
const crypto     = require('crypto');

const app = express();

// ── Middleware ──
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── CSRF ──
const csrfTokens = new Set();
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.add(token);
  setTimeout(() => csrfTokens.delete(token), 30 * 60 * 1000);
  res.json({ csrfToken: token });
});

function verifyCsrf(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || !csrfTokens.has(token)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }
  csrfTokens.delete(token);
  next();
}

// ── Sanitizer ──
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;')
    .trim();
}

// ── Gmail Transporter ──
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 465, secure: true,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

// ════════════════════════════════════════
// API: MEMBERSHIP SIGNUP  POST /api/join
// ════════════════════════════════════════
app.post('/api/join', verifyCsrf, async (req, res) => {
  const name    = sanitize(req.body.name);
  const email   = sanitize(req.body.email);
  const phone   = sanitize(req.body.phone);
  const plan    = sanitize(req.body.plan);
  const price   = sanitize(req.body.price);
  const billing = sanitize(req.body.billing);

  if (!name || !email || !phone || !plan || !billing)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (!['Basic','Premium','Elite'].includes(plan))
    return res.status(400).json({ error: 'Invalid plan.' });
  if (!['monthly','annual'].includes(billing))
    return res.status(400).json({ error: 'Invalid billing cycle.' });

  try {
    const billingLabel = billing === 'annual' ? 'Annual (Save 20%)' : 'Monthly';

    // Email to member
    await transporter.sendMail({
      from: `"NovaGym" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Welcome to NovaGym — Your ${plan} Membership is Confirmed! 🎉`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:40px 36px;text-align:center;">
            <h1 style="font-size:2.5rem;letter-spacing:4px;margin:0;">NOVA<span style="color:#e63030;">GYM</span></h1>
            <p style="color:rgba(255,255,255,0.6);margin-top:8px;letter-spacing:2px;font-size:0.85rem;">PREMIUM FITNESS EXPERIENCE</p>
          </div>
          <div style="padding:40px 36px;">
            <h2 style="color:#e63030;">Welcome, ${name}! 🎉</h2>
            <p style="color:rgba(255,255,255,0.75);line-height:1.7;">Your membership has been confirmed. Our team will contact you within <strong style="color:#fff;">24 hours</strong>.</p>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:28px 0;">
              <h3 style="color:#e63030;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Membership Details</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;">Plan</td><td style="color:#fff;font-weight:700;text-align:right;">${plan}</td></tr>
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.07);">Price</td><td style="color:#e63030;font-weight:700;text-align:right;">${price}</td></tr>
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.07);">Billing</td><td style="color:#fff;font-weight:700;text-align:right;">${billingLabel}</td></tr>
              </table>
            </div>
            <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;">Questions? Email <a href="mailto:hello@novagym.com" style="color:#e63030;">hello@novagym.com</a></p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 36px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2025 NovaGym. All rights reserved.</p>
          </div>
        </div>`
    });

    // Notification to gym owner
    await transporter.sendMail({
      from: `"NovaGym Signups" <${process.env.GMAIL_USER}>`,
      to: process.env.GYM_EMAIL,
      subject: `New Membership Signup — ${plan} Plan`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;">
        <h2 style="color:#e63030;">New Membership Signup</h2>
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
          <tr><td style="padding:8px;color:#555;">Name</td><td style="padding:8px;font-weight:700;">${name}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Email</td><td style="padding:8px;">${email}</td></tr>
          <tr><td style="padding:8px;color:#555;">Phone</td><td style="padding:8px;">${phone}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Plan</td><td style="padding:8px;font-weight:700;color:#e63030;">${plan}</td></tr>
          <tr><td style="padding:8px;color:#555;">Billing</td><td style="padding:8px;">${billingLabel}</td></tr>
        </table>
      </div>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Join error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════
// API: CONTACT FORM  POST /api/contact
// ════════════════════════════════════════
app.post('/api/contact', verifyCsrf, async (req, res) => {
  const name    = sanitize(req.body.name);
  const email   = sanitize(req.body.email);
  const phone   = sanitize(req.body.phone   || '');
  const service = sanitize(req.body.service || '');
  const message = sanitize(req.body.message);

  if (!name || !email || !message)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });
  if (message.length < 10)
    return res.status(400).json({ error: 'Message too short.' });

  try {
    // Confirmation to user
    await transporter.sendMail({
      from: `"NovaGym" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `We received your message, ${name}! 💪`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:40px 36px;text-align:center;">
            <h1 style="font-size:2.5rem;letter-spacing:4px;margin:0;">NOVA<span style="color:#e63030;">GYM</span></h1>
          </div>
          <div style="padding:40px 36px;">
            <h2 style="color:#e63030;">Thanks for reaching out, ${name}!</h2>
            <p style="color:rgba(255,255,255,0.75);line-height:1.7;">We've received your message and will get back to you within <strong style="color:#fff;">24 hours</strong>.</p>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:24px 0;">
              <p style="color:rgba(255,255,255,0.5);font-size:0.8rem;margin:0 0 8px;">YOUR MESSAGE</p>
              <p style="color:#fff;line-height:1.7;margin:0;">${message}</p>
            </div>
            <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;">Or call us: <a href="tel:+15551234567" style="color:#e63030;">+1 (555) 123-4567</a></p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 36px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2025 NovaGym. All rights reserved.</p>
          </div>
        </div>`
    });

    // Notification to gym owner
    await transporter.sendMail({
      from: `"NovaGym Contact" <${process.env.GMAIL_USER}>`,
      to: process.env.GYM_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;">
        <h2 style="color:#e63030;">New Contact Message</h2>
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
          <tr><td style="padding:8px;color:#555;">Name</td><td style="padding:8px;font-weight:700;">${name}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Email</td><td style="padding:8px;">${email}</td></tr>
          <tr><td style="padding:8px;color:#555;">Phone</td><td style="padding:8px;">${phone || '—'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Service</td><td style="padding:8px;">${service || '—'}</td></tr>
          <tr><td style="padding:8px;color:#555;vertical-align:top;">Message</td><td style="padding:8px;">${message}</td></tr>
        </table>
      </div>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════
// API: NEWSLETTER  POST /api/newsletter
// ════════════════════════════════════════
app.post('/api/newsletter', verifyCsrf, async (req, res) => {
  const email = sanitize(req.body.email);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Please enter a valid email address.' });

  try {
    await transporter.sendMail({
      from: `"NovaGym" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `You're subscribed to NovaGym! 🎉`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:40px 36px;text-align:center;">
            <h1 style="font-size:2.5rem;letter-spacing:4px;margin:0;">NOVA<span style="color:#e63030;">GYM</span></h1>
          </div>
          <div style="padding:40px 36px;text-align:center;">
            <h2 style="color:#e63030;">You're in! 🎉</h2>
            <p style="color:rgba(255,255,255,0.75);line-height:1.7;">Welcome to the NovaGym family. You'll receive workout tips, member offers, and gym news straight to your inbox.</p>
            <p style="color:rgba(255,255,255,0.4);font-size:0.8rem;margin-top:24px;">No spam, ever. Unsubscribe anytime.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 36px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2025 NovaGym. All rights reserved.</p>
          </div>
        </div>`
    });

    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This email is already subscribed.' });
    }
    console.error('Newsletter error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════
// API: CLASS BOOKING  POST /api/booking
// ════════════════════════════════════════
app.post('/api/booking', verifyCsrf, async (req, res) => {
  const name      = sanitize(req.body.name);
  const email     = sanitize(req.body.email);
  const phone     = sanitize(req.body.phone     || '');
  const className = sanitize(req.body.className);
  const trainer   = sanitize(req.body.trainer   || '');
  const duration  = sanitize(req.body.duration  || '');
  const date      = sanitize(req.body.date);
  const time      = sanitize(req.body.time);

  if (!name || !email || !className || !date || !time)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });

  try {
    // Confirmation to user
    await transporter.sendMail({
      from: `"NovaGym" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Class Booking Confirmed — ${className} 🏋️`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:40px 36px;text-align:center;">
            <h1 style="font-size:2.5rem;letter-spacing:4px;margin:0;">NOVA<span style="color:#e63030;">GYM</span></h1>
          </div>
          <div style="padding:40px 36px;">
            <h2 style="color:#e63030;">Booking Confirmed, ${name}! ✅</h2>
            <p style="color:rgba(255,255,255,0.75);line-height:1.7;">See you on the gym floor! Here are your booking details:</p>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:28px 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;">Class</td><td style="color:#fff;font-weight:700;text-align:right;">${className}</td></tr>
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.07);">Trainer</td><td style="color:#fff;text-align:right;">${trainer}</td></tr>
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.07);">Date</td><td style="color:#e63030;font-weight:700;text-align:right;">${date}</td></tr>
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.07);">Time</td><td style="color:#e63030;font-weight:700;text-align:right;">${time}</td></tr>
                <tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.07);">Duration</td><td style="color:#fff;text-align:right;">${duration}</td></tr>
              </table>
            </div>
            <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;">Need to cancel? Email <a href="mailto:hello@novagym.com" style="color:#e63030;">hello@novagym.com</a></p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:20px 36px;text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">© 2025 NovaGym. All rights reserved.</p>
          </div>
        </div>`
    });

    // Notification to gym owner
    await transporter.sendMail({
      from: `"NovaGym Bookings" <${process.env.GMAIL_USER}>`,
      to: process.env.GYM_EMAIL,
      subject: `New Class Booking — ${className}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;">
        <h2 style="color:#e63030;">New Class Booking</h2>
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
          <tr><td style="padding:8px;color:#555;">Name</td><td style="padding:8px;font-weight:700;">${name}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Email</td><td style="padding:8px;">${email}</td></tr>
          <tr><td style="padding:8px;color:#555;">Class</td><td style="padding:8px;font-weight:700;color:#e63030;">${className}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Trainer</td><td style="padding:8px;">${trainer}</td></tr>
          <tr><td style="padding:8px;color:#555;">Date</td><td style="padding:8px;">${date}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#555;">Time</td><td style="padding:8px;">${time}</td></tr>
        </table>
      </div>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Serve index.html for all non-API routes ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 NovaGym server running at http://localhost:${PORT}`));

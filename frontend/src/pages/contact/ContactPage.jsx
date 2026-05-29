import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Building2, Clock, ArrowRight, CheckCircle, Send } from 'lucide-react';
import Footer from '../../components/shared/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const contactCards = [
  {
    icon: MessageSquare,
    title: 'Sales & Demos',
    description: 'Talk to our team about enterprise pricing, custom integrations, and a live product walkthrough.',
    action: 'Book a demo',
    color: 'var(--accent)',
  },
  {
    icon: Mail,
    title: 'General Enquiries',
    description: 'Questions about our platform, methodology, or partnership opportunities.',
    action: 'hello@carbonx.io',
    color: 'var(--accent-blue)',
  },
  {
    icon: Building2,
    title: 'Enterprise',
    description: 'For organisations with 500+ employees or complex multi-entity structures.',
    action: 'enterprise@carbonx.io',
    color: 'var(--accent-gold)',
  },
  {
    icon: Clock,
    title: 'Support',
    description: '24/7 support for existing customers. Average first-response time: 4 minutes.',
    action: 'support@carbonx.io',
    color: 'var(--danger)',
  },
];

const topicsOptions = [
  'Product Demo',
  'Pricing & Plans',
  'Enterprise Enquiry',
  'Technical Support',
  'Partnership',
  'Press & Media',
  'Other',
];

const InputField = ({ label, type = 'text', placeholder, value, onChange, required }) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="input-field w-full"
    />
  </div>
);

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', company: '', topic: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission (replace with real API call)
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }} className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="orb orb-green w-[450px] h-[450px] top-[-100px] left-[-150px] opacity-35" />
        <div className="orb orb-blue  w-[350px] h-[350px] bottom-0   right-[-100px] opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              Contact Us
            </motion.p>
            <motion.h1 variants={fadeUp} className="section-title text-5xl md:text-6xl mb-6">
              Let's talk about your <em>carbon journey</em>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Whether you're exploring carbon accounting for the first time or looking to
              upgrade your current tools, we'd love to help.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {contactCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  className="contact-card glass-card rounded-2xl p-6 flex flex-col gap-4"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}1a`, border: `1px solid ${card.color}33` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {card.description}
                    </p>
                  </div>
                  <button
                    className="text-sm font-semibold flex items-center gap-1.5 group"
                    style={{ color: card.color }}
                  >
                    {card.action}
                    <ArrowRight
                      className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section className="py-20" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

            {/* Left info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="lg:col-span-2"
            >
              <motion.p variants={fadeUp} className="section-label mb-5">Get in Touch</motion.p>
              <motion.h2 variants={fadeUp} className="section-title text-3xl md:text-4xl mb-6">
                Send us a <em>message</em>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Fill in the form and we'll get back to you within one business day.
                For urgent support, use the live chat in the dashboard.
              </motion.p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  { label: 'Response time', value: '< 1 business day' },
                  { label: 'Demo available', value: 'Mon–Fri, 9am–6pm GMT' },
                  { label: 'Enterprise SLA', value: '4-hour response guaranteed' },
                ].map((item) => (
                  <motion.div key={item.label} variants={fadeUp} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <div className="text-sm">
                      <span style={{ color: 'var(--text-muted)' }}>{item.label}: </span>
                      <span style={{ color: 'var(--text)' }}>{item.value}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-3"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="glass-card rounded-2xl p-10 text-center"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.25)' }}
                  >
                    <CheckCircle className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3 className="section-title text-2xl mb-3">Message sent!</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Thanks for reaching out, {form.name.split(' ')[0] || 'there'}. We'll get back to you
                    at <span style={{ color: 'var(--accent)' }}>{form.email}</span> within one business day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', topic: '', message: '' }); }}
                    className="mt-6 btn-outline px-6 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="glass-card rounded-2xl p-8 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputField
                      label="Full Name"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={set('name')}
                      required
                    />
                    <InputField
                      label="Work Email"
                      type="email"
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={set('email')}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputField
                      label="Company"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={set('company')}
                    />
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Topic <span style={{ color: 'var(--accent)' }}>*</span>
                      </label>
                      <select
                        value={form.topic}
                        onChange={set('topic')}
                        required
                        className="input-field w-full"
                        style={{ appearance: 'none', cursor: 'pointer' }}
                      >
                        <option value="" disabled>Select a topic…</option>
                        {topicsOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Message <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <textarea
                      placeholder="Tell us about your organization, current challenges, and what you're looking for…"
                      value={form.message}
                      onChange={set('message')}
                      required
                      rows={5}
                      className="input-field w-full resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
                    By submitting, you agree to our{' '}
                    <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>.
                    We never share your data with third parties.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Office / Global ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-4">
              Global Presence
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-3xl md:text-4xl">
              We're available <em>worldwide</em>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            {[
              { region: 'Europe HQ', city: 'London, UK', time: 'GMT+1', note: 'Primary headquarters' },
              { region: 'North America', city: 'New York, USA', time: 'EST', note: 'Regional office' },
              { region: 'Asia Pacific', city: 'Singapore', time: 'SGT', note: 'APAC coverage' },
            ].map((office) => (
              <motion.div key={office.region} variants={fadeUp} className="glass-card rounded-2xl p-6 text-center">
                <p className="section-label justify-center mb-3">{office.region}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{office.city}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{office.time}</p>
                <p
                  className="text-xs mt-3 px-2 py-1 rounded-full inline-block font-mono"
                  style={{
                    background: 'rgba(var(--accent-rgb),0.08)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(var(--accent-rgb),0.15)',
                  }}
                >
                  {office.note}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

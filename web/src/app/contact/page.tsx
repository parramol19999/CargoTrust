'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Mail, 
  Send, 
  MessageSquare, 
  Github, 
  Twitter, 
  Bug, 
  Lightbulb, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: 'general', message: '' });
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        
        {/* Header Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-lg text-xs font-mono font-bold uppercase">
            Support Desk & Feedback
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Get in Touch with CargoTrust
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Have questions about integrating verified crop twins? Want to report a bug or request a feature? We would love to hear from you.
          </p>
        </div>

        {/* Support Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => setFormData(prev => ({ ...prev, subject: 'bug' }))}
            className={`p-5 rounded-2xl border text-left flex gap-4 transition duration-200 ${
              formData.subject === 'bug' 
                ? 'bg-rose-50 border-rose-200/80 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:bg-slate-100/50'
            }`}
          >
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-xs">Report a Bug</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Found a smart contract lock or UI error? Let us know.</p>
            </div>
          </button>

          <button 
            onClick={() => setFormData(prev => ({ ...prev, subject: 'feature' }))}
            className={`p-5 rounded-2xl border text-left flex gap-4 transition duration-200 ${
              formData.subject === 'feature' 
                ? 'bg-emerald-50 border-emerald-200/80 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:bg-slate-100/50'
            }`}
          >
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-xs">Request a Feature</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Have ideas to improve Crop escrows or telemetry logs?</p>
            </div>
          </button>

          <button 
            onClick={() => setFormData(prev => ({ ...prev, subject: 'general' }))}
            className={`p-5 rounded-2xl border text-left flex gap-4 transition duration-200 ${
              formData.subject === 'general' 
                ? 'bg-blue-50 border-blue-200/80 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:bg-slate-100/50'
            }`}
          >
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-xs">General Inquiry</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Interested in partnership or deployment details?</p>
            </div>
          </button>
        </div>

        {/* Contact Form Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-950">Thank you!</h2>
                <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Your message has been sent successfully. Our team will review your ticket and get back to you within 24 hours.
                </p>
              </div>
              <button 
                onClick={() => setSubmitted(false)}
                className="h-9 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Send Another Message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest px-1">Your Name</label>
                  <div className="input-group-container flex items-center px-4 py-2 border border-slate-200 bg-white">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-950 placeholder:text-slate-400 py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest px-1">Your Email</label>
                  <div className="input-group-container flex items-center px-4 py-2 border border-slate-200 bg-white">
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-950 placeholder:text-slate-400 py-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest px-1">Message</label>
                <div className="input-group-container border border-slate-200 bg-white p-3">
                  <textarea 
                    required
                    rows={5}
                    placeholder="Tell us about the issue or feature you are interested in..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-950 placeholder:text-slate-400 resize-none font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 transition select-none"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Sending Message...' : 'Submit Support Request'}
              </button>
            </form>
          )}
        </div>

        {/* Social / Developer Links Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-400 gap-4">
          <div className="flex gap-4">
            <a 
              href="mailto:support@cargotrust.com"
              className="flex items-center gap-1.5 hover:text-slate-900 transition font-medium"
            >
              <Mail className="w-4 h-4 text-slate-400" />
              support@cargotrust.com
            </a>
            <div className="w-px h-4 bg-slate-200" />
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Discord Community
            </span>
          </div>
          <div className="flex gap-3">
            <a href="https://github.com/parramol19999" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-900 transition font-mono">
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-slate-900 transition font-mono">
              <Twitter className="w-4 h-4" />
              X/Twitter
            </a>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

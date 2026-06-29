'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Users, 
  Heart, 
  MapPin, 
  Github, 
  Twitter, 
  Globe, 
  FileText,
  Mail,
  ShieldCheck,
  Leaf
} from 'lucide-react';

export default function AboutPage() {
  const team = [
    {
      name: 'Eric Parra',
      role: 'Founder & Blockchain Architect',
      bio: 'Ex-Supply Chain consultant. Focused on bringing decentralized finance tools to real-world agricultural trade.',
      location: 'Geneva, Switzerland',
      github: 'https://github.com/parramol19999',
      twitter: '#'
    },
    {
      name: 'Elena Rostova',
      role: 'Lead Full-Stack & IoT Lead',
      bio: 'IoT engineer and hardware hacker. Designed CargoPilot telemetry nodes and built the Next.js/Viem interface.',
      location: 'Berlin, Germany',
      github: '#',
      twitter: '#'
    },
    {
      name: 'Samuel Kiprop',
      role: 'Operations & Grower Relations',
      bio: 'Former coffee cooperative lead in East Africa. Bridging the gap between agricultural producers and CargoTrust developers.',
      location: 'Nairobi, Kenya',
      github: '#',
      twitter: '#'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-12 animate-fade-in-up">
        
        {/* Header Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-mono font-bold uppercase">
            Our Mission & Story
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Bridging Physical Trade & Cryptographic Trust
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Meet the team behind CargoTrust, building on Arc to connect agricultural cooperatives directly with global buyers.
          </p>
        </div>

        {/* Narrative Storytelling Section */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 bg-emerald-50 rounded text-emerald-600"><Leaf className="w-4 h-4" /></span>
            Why we are building CargoTrust
          </h2>
          
          <p>
            In late 2025, our team visited coffee cooperatives in eastern Africa. We observed firsthand the complex, paper-driven process farmers go through to export their harvests. Even after premium coffee passed extensive laboratory moisture and quality evaluations, the cooperative had to wait weeks for bank letters of credit to clear, causing cash-flow gaps that delayed worker payments.
          </p>

          <p>
            We realized that by combining <strong className="text-slate-800">on-chain asset tokenization</strong>, <strong className="text-slate-800">immutable quality verification signatures</strong>, and <strong className="text-slate-800">decentralized stablecoin escrows</strong>, we could build a settlement flow that executes instantly, costs pennies, and removes counterparty risk.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 text-xs italic">
            <span className="text-2xl text-emerald-500 font-serif leading-none">“</span>
            <p className="text-slate-500">
              Our vision is a human-first, frictionless B2B commerce network. Farmers get paid immediately upon crop verification, and importers get absolute cryptographic security that they are buying exactly what was tested in the laboratory.
            </p>
          </div>
        </div>

        {/* Team Members List */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-slate-950 rounded-full" />
            <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold">
              The Founding Team
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200/80 p-6 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-950 text-base">{member.name}</h3>
                    <p className="text-xs font-semibold text-cyan-600">{member.role}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{member.bio}</p>
                </div>

                <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={member.github} className="hover:text-slate-900 transition"><Github className="w-3.5 h-3.5" /></a>
                    <a href={member.twitter} className="hover:text-slate-900 transition"><Twitter className="w-3.5 h-3.5" /></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hackathon Mentions */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2 text-left">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Built for the Circle Commerce Stack Challenge
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-sans">
              CargoTrust represents a functional prototype demonstrating how stablecoins (USDC) and compliance-native registries can be integrated into high-speed blockchain ecosystems like Arc to automate supply chains.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-[10px] text-cyan-400 font-mono font-bold rounded-lg uppercase">
            🚀 MVP Phase v1.0
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

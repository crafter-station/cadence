"use client"

import Link from "next/link"
import { ArrowRight, Play, Zap, Users, GitBranch, BarChart3, Sparkles } from "lucide-react"
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E4D9] overflow-hidden relative">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial lines - pre-calculated to avoid hydration mismatch */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMinYMin slice"
      >
        <line x1="150" y1="200" x2="1650" y2="200" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="1599" y2="588" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="1450" y2="950" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="1210" y2="1250" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="900" y2="1500" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="538" y2="1649" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="150" y2="1700" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-238" y2="1649" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-600" y2="1500" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-910" y2="1250" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-1150" y2="950" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-1299" y2="588" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-1350" y2="200" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-1299" y2="-188" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-1150" y2="-550" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-910" y2="-850" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-600" y2="-1100" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="-238" y2="-1249" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="150" y2="-1300" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="538" y2="-1249" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="900" y2="-1100" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="1210" y2="-850" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="1450" y2="-550" stroke="#E8E4D9" strokeWidth="0.5" />
        <line x1="150" y1="200" x2="1599" y2="-188" stroke="#E8E4D9" strokeWidth="0.5" />
      </svg>

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#E8E4D9]" />
          <span className="text-sm font-medium tracking-tight">cadence</span>
        </div>

        <div className="flex items-center gap-8">
          <Link href="#features" className="text-xs text-[#E8E4D9]/60 hover:text-[#E8E4D9] transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-xs text-[#E8E4D9]/60 hover:text-[#E8E4D9] transition-colors">
            How It Works
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs px-4 py-2 bg-[#E8E4D9] text-[#0A0A0A] hover:bg-[#E8E4D9]/90 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app"
              className="text-xs px-4 py-2 bg-[#E8E4D9] text-[#0A0A0A] hover:bg-[#E8E4D9]/90 transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Floating labels */}
      <div className="absolute top-32 left-12 text-[10px] text-[#E8E4D9]/40 tracking-wider">
        Parallel<br />Execution
      </div>
      <div className="absolute top-48 right-24 text-[10px] text-[#E8E4D9]/40 tracking-wider text-right">
        Synthetic<br />Personas
      </div>
      <div className="absolute top-[40%] left-[15%] text-[10px] text-[#E8E4D9]/40 tracking-wider">
        Self-Healing<br />Prompts
      </div>
      <div className="absolute top-[35%] right-[20%] text-[10px] text-[#E8E4D9]/40 tracking-wider text-right">
        Real-Time<br />Analytics
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-8 pt-32 pb-48 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <p className="text-sm italic text-[#E8E4D9]/60 mb-6">
            A Testing Framework for AI Agents
            <br />& LLM-Powered Systems
          </p>

          <div className="h-px w-48 bg-[#E8E4D9]/30 mb-8" />

          {/* Glitch effect container */}
          <div className="relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(232, 228, 217, 0.1) 2px,
                  rgba(232, 228, 217, 0.1) 4px
                )`,
              }}
            />
            <h1 className="text-[clamp(4rem,12vw,10rem)] font-bold leading-[0.85] tracking-[-0.04em] relative">
              Large-Scale
              <br />
              <span className="relative inline-block">
                Agent
                <div className="absolute -inset-x-4 inset-y-2 bg-gradient-to-r from-transparent via-[#E8E4D9]/5 to-transparent" />
              </span>
              <br />
              Evaluation
            </h1>
          </div>

          <div className="mt-16 flex items-center gap-6">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group flex items-center gap-3 px-6 py-3 bg-[#E8E4D9] text-[#0A0A0A] text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors">
                  Start Testing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/app"
                className="group flex items-center gap-3 px-6 py-3 bg-[#E8E4D9] text-[#0A0A0A] text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </SignedIn>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 text-sm text-[#E8E4D9]/60 hover:text-[#E8E4D9] transition-colors"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-t border-b border-[#E8E4D9]/10">
        <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-4 gap-8">
          <div>
            <div className="text-3xl font-bold tracking-tight">10,000+</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Tests per Run</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">50x</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Parallel Sessions</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">6</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Persona Types</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">&lt;2s</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Avg Latency</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-8 py-32 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mb-4">Core Capabilities</p>
          <h2 className="text-4xl font-bold tracking-tight">
            Everything You Need to<br />
            Ship Reliable AI Agents
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-px bg-[#E8E4D9]/10">
          {[
            {
              icon: Users,
              title: "Synthetic Personas",
              description: "Test against 6 distinct user archetypes—from frustrated executives to confused elderly users.",
            },
            {
              icon: Zap,
              title: "Parallel Execution",
              description: "Run thousands of concurrent test sessions with configurable concurrency controls.",
            },
            {
              icon: Sparkles,
              title: "Self-Healing Prompts",
              description: "AI analyzes failures and suggests prompt improvements with confidence scores.",
            },
            {
              icon: GitBranch,
              title: "A/B Testing",
              description: "Compare prompt versions with statistical significance and automatic winner detection.",
            },
            {
              icon: BarChart3,
              title: "Business Metrics",
              description: "Track resolution rates, CSAT scores, handle time, and cost per interaction.",
            },
            {
              icon: Play,
              title: "Scenario Builder",
              description: "Create scripted conversation flows with assertions and validation rules.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-[#0A0A0A] p-8 group hover:bg-[#E8E4D9]/[0.02] transition-colors"
            >
              <feature.icon className="w-5 h-5 text-[#E8E4D9]/40 mb-6 group-hover:text-[#E8E4D9] transition-colors" />
              <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
              <p className="text-sm text-[#E8E4D9]/50 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-8 py-32 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mb-4">Workflow</p>
          <h2 className="text-4xl font-bold tracking-tight">
            Three Steps to<br />
            Production-Ready Agents
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-16">
          {[
            {
              step: "01",
              title: "Configure",
              description: "Select test personas, set concurrency, define success metrics and business outcome targets.",
            },
            {
              step: "02",
              title: "Execute",
              description: "Launch parallel test sessions with real-time progress streaming and live transcript viewing.",
            },
            {
              step: "03",
              title: "Optimize",
              description: "Review AI-generated suggestions, apply fixes, and iterate until your agent meets quality bars.",
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="text-[8rem] font-bold leading-none text-[#E8E4D9]/[0.03] absolute -top-8 -left-4">
                {item.step}
              </div>
              <div className="relative">
                <div className="text-xs text-[#E8E4D9]/40 mb-2">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-sm text-[#E8E4D9]/50 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-32 max-w-7xl mx-auto border-t border-[#E8E4D9]/10">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight leading-[1.1] mb-8">
            Stop Shipping
            <br />
            Broken Agents
          </h2>
          <p className="text-[#E8E4D9]/50 mb-8 leading-relaxed">
            Join teams using Cadence to validate their AI systems before users find the edge cases.
            Free to start, scales with your testing needs.
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="group flex items-center gap-3 px-8 py-4 bg-[#E8E4D9] text-[#0A0A0A] text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#E8E4D9] text-[#0A0A0A] text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-[#E8E4D9]/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#E8E4D9]/40" />
            <span className="text-xs text-[#E8E4D9]/40">cadence</span>
          </div>
          <div className="text-[10px] text-[#E8E4D9]/30">
            Copyright Crafter Station 2025
          </div>
        </div>
      </footer>
    </div>
  )
}

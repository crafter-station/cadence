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
      <nav className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#E8E4D9]" />
          <span className="text-sm font-medium tracking-tight">cadence</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="#features" className="hidden sm:block text-xs text-[#E8E4D9]/60 hover:text-[#E8E4D9] transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="hidden sm:block text-xs text-[#E8E4D9]/60 hover:text-[#E8E4D9] transition-colors">
            How It Works
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs px-3 sm:px-4 py-2 bg-[#E8E4D9] text-[#0A0A0A] hover:bg-[#E8E4D9]/90 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app"
              className="text-xs px-3 sm:px-4 py-2 bg-[#E8E4D9] text-[#0A0A0A] hover:bg-[#E8E4D9]/90 transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Floating labels - hidden on mobile */}
      <div className="hidden lg:block absolute top-32 left-12 text-[10px] text-[#E8E4D9]/40 tracking-wider">
        Parallel<br />Execution
      </div>
      <div className="hidden lg:block absolute top-48 right-24 text-[10px] text-[#E8E4D9]/40 tracking-wider text-right">
        Synthetic<br />Personas
      </div>
      <div className="hidden lg:block absolute top-[40%] left-[15%] text-[10px] text-[#E8E4D9]/40 tracking-wider">
        Self-Healing<br />Prompts
      </div>
      <div className="hidden lg:block absolute top-[35%] right-[20%] text-[10px] text-[#E8E4D9]/40 tracking-wider text-right">
        Real-Time<br />Analytics
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-8 pt-16 sm:pt-32 pb-24 sm:pb-48 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <p className="text-xs sm:text-sm italic text-[#E8E4D9]/60 mb-4 sm:mb-6">
            A Testing Framework for AI Agents
            <br />& LLM-Powered Systems
          </p>

          <div className="h-px w-32 sm:w-48 bg-[#E8E4D9]/30 mb-6 sm:mb-8" />

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

          <div className="mt-8 sm:mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#E8E4D9] text-[#0A0A0A] text-xs sm:text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors">
                  Start Testing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/app"
                className="group flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#E8E4D9] text-[#0A0A0A] text-xs sm:text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </SignedIn>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 text-xs sm:text-sm text-[#E8E4D9]/60 hover:text-[#E8E4D9] transition-colors"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-t border-b border-[#E8E4D9]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">10,000+</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Tests per Run</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">50x</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Parallel Sessions</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">6</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Persona Types</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">&lt;2s</div>
            <div className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mt-1">Avg Latency</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-8 py-16 sm:py-32 max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-16">
          <p className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mb-3 sm:mb-4">Core Capabilities</p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Everything You Need to<br />
            Ship Reliable AI Agents
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E8E4D9]/10">
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
              className="bg-[#0A0A0A] p-5 sm:p-8 group hover:bg-[#E8E4D9]/[0.02] transition-colors"
            >
              <feature.icon className="w-5 h-5 text-[#E8E4D9]/40 mb-4 sm:mb-6 group-hover:text-[#E8E4D9] transition-colors" />
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-[#E8E4D9]/50 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-4 sm:px-8 py-16 sm:py-32 max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-16">
          <p className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mb-3 sm:mb-4">Workflow</p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Three Steps to<br />
            Production-Ready Agents
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-16">
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
              <div className="text-[5rem] sm:text-[8rem] font-bold leading-none text-[#E8E4D9]/[0.03] absolute -top-6 sm:-top-8 -left-2 sm:-left-4">
                {item.step}
              </div>
              <div className="relative">
                <div className="text-xs text-[#E8E4D9]/40 mb-2">{item.step}</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{item.title}</h3>
                <p className="text-xs sm:text-sm text-[#E8E4D9]/50 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-8 py-16 sm:py-32 max-w-7xl mx-auto border-t border-[#E8E4D9]/10">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6 sm:mb-8">
            Stop Shipping
            <br />
            Broken Agents
          </h2>
          <p className="text-sm sm:text-base text-[#E8E4D9]/50 mb-6 sm:mb-8 leading-relaxed">
            Join teams using Cadence to validate their AI systems before users find the edge cases.
            Free to start, scales with your testing needs.
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="group flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#E8E4D9] text-[#0A0A0A] text-xs sm:text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app"
              className="group inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#E8E4D9] text-[#0A0A0A] text-xs sm:text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 overflow-hidden">
        {/* Top Divider */}
        <div className="h-px w-full border-t border-[#E8E4D9]/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 pb-32 sm:pb-48 md:pb-64 lg:pb-80">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column - Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-8 sm:gap-y-10">
              {/* Features Column */}
              <div>
                <h3 className="text-sm text-[#E8E4D9] mb-3 sm:mb-4">Features</h3>
                <div className="space-y-2 sm:space-y-2.5">
                  {[
                    { href: "/app", label: "Evaluation" },
                    { href: "/app/personas", label: "Personas" },
                    { href: "/app/scenarios", label: "Scenarios" },
                    { href: "/app/ab-testing", label: "A/B Testing" },
                    { href: "/app/prompts", label: "Prompts" },
                    { href: "/app/history", label: "History" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-xs sm:text-sm text-[#E8E4D9]/50 hover:text-[#E8E4D9] transition-colors block"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resources Column */}
              <div>
                <h3 className="text-sm text-[#E8E4D9] mb-3 sm:mb-4">Resources</h3>
                <div className="space-y-2 sm:space-y-2.5">
                  {[
                    { href: "#", label: "Documentation" },
                    { href: "#", label: "API Reference" },
                    { href: "#", label: "Changelog" },
                    { href: "#", label: "Support" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-xs sm:text-sm text-[#E8E4D9]/50 hover:text-[#E8E4D9] transition-colors block"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Company Column */}
              <div className="col-span-2 sm:col-span-1">
                <h3 className="text-sm text-[#E8E4D9] mb-3 sm:mb-4">Company</h3>
                <div className="space-y-2 sm:space-y-2.5">
                  {[
                    { href: "https://github.com/crafter-station", label: "GitHub", external: true },
                    { href: "https://x.com/craboratory", label: "X / Twitter", external: true },
                    { href: "#", label: "Privacy Policy", external: false },
                    { href: "#", label: "Terms of Service", external: false },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="text-xs sm:text-sm text-[#E8E4D9]/50 hover:text-[#E8E4D9] transition-colors block"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Tagline */}
            <div className="flex flex-col items-start lg:items-end gap-4 sm:gap-6">
              <p className="text-sm sm:text-base lg:text-xl text-[#E8E4D9] text-left lg:text-right max-w-md">
                Large-scale testing infrastructure for AI agents that actually works.
              </p>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-[#E8E4D9]/50">System status:</span>
                <span className="text-xs sm:text-sm text-[#E8E4D9]">Operational</span>
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full relative z-10" />
                  <div
                    className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 sm:my-16">
            <div className="h-px w-full border-t border-[#E8E4D9]/10" />
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#E8E4D9]/40" />
              <span className="text-xs sm:text-sm text-[#E8E4D9]/40">cadence</span>
            </div>
            <p className="text-xs sm:text-sm text-[#E8E4D9]/30">
              © 2025 Crafter Station. All rights reserved.
            </p>
          </div>
        </div>

        {/* Large Wordmark */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden">
          <h1
            className="text-[80px] sm:text-[140px] md:text-[200px] lg:text-[280px] xl:text-[360px] font-bold leading-none tracking-[-0.04em] translate-y-[20%] sm:translate-y-[25%]"
            style={{
              WebkitTextStroke: "1px rgba(232, 228, 217, 0.2)",
              color: "transparent",
            }}
          >
            cadence
          </h1>
        </div>
      </footer>
    </div>
  )
}

"use client"

import Link from "next/link"
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0908] overflow-hidden">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle gradient light effect */}
      <div
        className="absolute top-0 right-0 w-[800px] h-[800px] opacity-[0.07]"
        style={{
          background: "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)",
        }}
      />

      {/* Secondary gradient */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-[0.04]"
        style={{
          background: "radial-gradient(ellipse at 30% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-2xl">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] text-white/90 uppercase">
              Cadence
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-sm md:text-base text-white/40 tracking-[0.15em] uppercase mb-12">
            AI Agent Evaluation Platform
          </p>

          {/* Description */}
          <p className="text-white/50 text-sm md:text-base leading-relaxed mb-16 max-w-md mx-auto font-light">
            Large-scale parallel testing and optimization for AI agents.
            Evaluate with synthetic personas. Ship with confidence.
          </p>

          {/* CTA */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="group inline-flex items-center gap-3 px-8 py-3 text-sm tracking-[0.1em] uppercase text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all duration-300">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/app"
              className="group inline-flex items-center gap-3 px-8 py-3 text-sm tracking-[0.1em] uppercase text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all duration-300"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </SignedIn>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/20 text-xs tracking-[0.15em] uppercase">
            by Crafter Station
          </p>
        </div>
      </div>
    </div>
  )
}

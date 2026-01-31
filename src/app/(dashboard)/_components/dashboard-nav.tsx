"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import {
  Play,
  FileText,
  History,
  FlaskConical,
  GitBranch,
  Terminal,
  LayoutDashboard,
  Users,
} from "lucide-react"

const MODULES = [
  { id: "evaluation", href: "/", label: "Evaluation", icon: Play },
  { id: "prompts", href: "/prompts", label: "Prompts", icon: FileText },
  { id: "personas", href: "/personas", label: "Personas", icon: Users },
  { id: "scenarios", href: "/scenarios", label: "Scenarios", icon: FlaskConical },
  { id: "ab-testing", href: "/ab-testing", label: "A/B Testing", icon: GitBranch },
  { id: "history", href: "/history", label: "History", icon: History },
  { id: "debug", href: "/debug", label: "Debug", icon: Terminal },
]

export function DashboardNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <div className="border-b border-border/50 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <LayoutDashboard className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-lg tracking-tight">cadence</span>
            </Link>

            <nav className="flex items-center gap-1">
              {MODULES.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      isActive(module.href)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {module.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono">v1.5.0</span>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-7 h-7",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </div>
  )
}

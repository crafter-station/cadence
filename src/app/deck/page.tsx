"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import {
  Users,
  Zap,
  Target,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Coffee,
  Bug,
  ArrowRight,
  Sparkles,
  BarChart3,
  Brain,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

const TOTAL_SLIDES = 8

export default function DeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)

  const scrollToSlide = useCallback((index: number) => {
    if (index < 0 || index >= TOTAL_SLIDES) return
    if (isScrolling.current) return

    isScrolling.current = true
    setCurrentSlide(index)

    const sections = containerRef.current?.querySelectorAll("section")
    if (sections && sections[index]) {
      sections[index].scrollIntoView({ behavior: "smooth" })
      setTimeout(() => {
        isScrolling.current = false
      }, 800)
    }
  }, [])

  const nextSlide = useCallback(() => {
    scrollToSlide(currentSlide + 1)
  }, [currentSlide, scrollToSlide])

  const prevSlide = useCallback(() => {
    scrollToSlide(currentSlide - 1)
  }, [currentSlide, scrollToSlide])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case " ":
        case "Enter":
        case "PageDown":
          e.preventDefault()
          nextSlide()
          break
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault()
          prevSlide()
          break
        case "Home":
          e.preventDefault()
          scrollToSlide(0)
          break
        case "End":
          e.preventDefault()
          scrollToSlide(TOTAL_SLIDES - 1)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextSlide, prevSlide, scrollToSlide])

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling.current) return

      const sections = containerRef.current?.querySelectorAll("section")
      if (!sections) return

      const scrollPosition = window.scrollY + window.innerHeight / 2

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        const sectionTop = rect.top + window.scrollY
        const sectionBottom = sectionTop + rect.height

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          setCurrentSlide(index)
        }
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0A0A0A] text-[#E8E4D9] overflow-hidden relative">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Slide indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-1 text-[#E8E4D9]/40 hover:text-[#E8E4D9] disabled:opacity-30 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <div className="flex flex-col gap-1.5 py-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToSlide(i)}
              className={`w-2 h-2 transition-all ${
                i === currentSlide
                  ? "bg-[#E8E4D9] scale-125"
                  : "bg-[#E8E4D9]/20 hover:bg-[#E8E4D9]/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          disabled={currentSlide === TOTAL_SLIDES - 1}
          className="p-1 text-[#E8E4D9]/40 hover:text-[#E8E4D9] disabled:opacity-30 transition-colors"
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-xs text-[#E8E4D9]/30 flex items-center gap-4">
        <span className="hidden md:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-[#E8E4D9]/10 text-[10px]">Space</kbd>
          <span>or arrows to navigate</span>
        </span>
        <span>{currentSlide + 1} / {TOTAL_SLIDES}</span>
      </div>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-3 h-3 bg-[#E8E4D9]" />
            <span className="text-sm font-medium tracking-tight">cadence</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em]">
            Cadence
          </h1>
          <p className="text-xl md:text-2xl text-[#E8E4D9]/60 font-light">
            Testing inteligente para agentes de IA
          </p>
        </div>
      </section>

      {/* The Problem - Story */}
      <section className="min-h-screen flex items-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-center mb-16">
            Todos hemos estado ahí
          </h2>

          <div className="space-y-8 text-xl md:text-2xl text-[#E8E4D9]/60 leading-relaxed">
            <p>
              Lanzas tu chatbot. Funciona <span className="text-[#E8E4D9]">perfecto</span> en desarrollo.
            </p>
            <p>
              Luego un cliente escribe:
            </p>
            <p className="text-[#E8E4D9] font-mono bg-[#E8E4D9]/5 px-4 py-3 border border-[#E8E4D9]/20">
              "ayudame porfavor urgente!!! mi cuenta"
            </p>
            <p>
              Y tu agente... <span className="text-red-400">no sabe qué hacer.</span>
            </p>
          </div>

          <div className="pt-12 border-t border-[#E8E4D9]/10">
            <p className="text-2xl md:text-3xl font-light text-center">
              El problema no es tu código.<br />
              <span className="text-[#E8E4D9]/50">Es que nunca testeaste cómo se comporta tu IA con usuarios reales.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Reality of AI Development */}
      <section className="min-h-screen flex items-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-center mb-16">
            La realidad del desarrollo de IA
          </h2>

          <div className="space-y-4">
            {[
              { icon: Bug, text: "Cambias un prompt", result: "rompes 15 flujos sin darte cuenta" },
              { icon: Clock, text: "Testas manualmente", result: "cubres 10 escenarios, tus usuarios encuentran 100" },
              { icon: Zap, text: "Despliegas con confianza", result: "los casos extremos aparecen el fin de semana" },
              { icon: AlertCircle, text: "Debuggeas en producción", result: "mientras tus usuarios esperan" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-6 p-6 bg-[#E8E4D9]/[0.02] border border-[#E8E4D9]/10 hover:bg-[#E8E4D9]/[0.04] transition-colors"
              >
                <item.icon className="w-5 h-5 text-[#E8E4D9]/40 shrink-0" />
                <div className="flex-1">
                  <span className="text-[#E8E4D9]">{item.text}</span>
                  <span className="text-[#E8E4D9]/40"> → </span>
                  <span className="text-red-400/80">{item.result}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-3xl md:text-4xl font-light text-center mt-16">
            No debería ser así.
          </p>
        </div>
      </section>

      {/* Cadence Solution */}
      <section className="min-h-screen flex items-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-8">
            Cadence cambia el juego
          </h2>

          <p className="text-xl md:text-2xl text-[#E8E4D9]/60 mb-16 max-w-2xl mx-auto">
            Imagina poder testear tu agente de IA contra <span className="text-[#E8E4D9]">miles de conversaciones</span> antes de que tus usuarios las tengan.
          </p>

          <div className="text-left max-w-xl mx-auto">
            <p className="text-sm text-[#E8E4D9]/40 uppercase tracking-wider mb-6">Con personas que simulan:</p>
            <div className="space-y-3">
              {[
                { persona: "El ejecutivo frustrado", detail: "que no tiene tiempo" },
                { persona: "La abuela confundida", detail: "que necesita ayuda" },
                { persona: "El desarrollador", detail: "que busca precisión técnica" },
                { persona: "El cliente escéptico", detail: "que no confía fácilmente" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 bg-[#E8E4D9]/[0.02] border border-[#E8E4D9]/10"
                >
                  <div className="w-1.5 h-1.5 bg-[#E8E4D9] shrink-0" />
                  <div>
                    <span className="text-[#E8E4D9]">{item.persona}</span>
                    <span className="text-[#E8E4D9]/50"> {item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex items-center justify-center gap-3 text-lg text-[#E8E4D9]/50">
            <span>Todo esto corriendo en paralelo.</span>
            <Coffee className="w-5 h-5" />
            <span className="text-[#E8E4D9]">Mientras tomas un café.</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="min-h-screen flex items-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-[#E8E4D9]/40 uppercase tracking-wider mb-4">Workflow</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-16">
            Cómo funciona
          </h2>

          <div className="space-y-10">
            {[
              {
                step: "01",
                title: "Define tu escenario",
                example: '"Agente de ventas intenta agendar reunión con prospecto"',
                icon: Target,
              },
              {
                step: "02",
                title: "Elige tus personas",
                example: "Selecciona qué tipos de usuarios quieres simular",
                icon: Users,
              },
              {
                step: "03",
                title: "Déjanos correr",
                example: "Lanzamos cientos de conversaciones en paralelo",
                icon: Zap,
              },
              {
                step: "04",
                title: "Ve qué falló (y por qué)",
                example: "No solo errores. Patrones. Insights. Soluciones.",
                icon: BarChart3,
              },
              {
                step: "05",
                title: "Mejora automáticamente",
                example: "Nuestra IA analiza las fallas y te sugiere cómo arreglar tu prompt",
                icon: Sparkles,
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="relative">
                  <div className="text-xs text-[#E8E4D9]/30">{item.step}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-4 h-4 text-[#E8E4D9]/40 group-hover:text-[#E8E4D9] transition-colors" />
                    <h3 className="text-xl font-medium">{item.title}</h3>
                  </div>
                  <p className="text-[#E8E4D9]/50">{item.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="min-h-screen flex items-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4">
            Demo
          </h2>
          <p className="text-xl text-[#E8E4D9]/50 mb-16">
            Veámoslo en vivo
          </p>

          <div className="aspect-video bg-[#E8E4D9]/[0.02] border border-[#E8E4D9]/10 flex items-center justify-center mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E8E4D9]/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#E8E4D9]/60" />
              </div>
              <p className="text-[#E8E4D9]/40">Demo en vivo</p>
            </div>
          </div>

          <div className="text-left max-w-xl mx-auto">
            <p className="text-sm text-[#E8E4D9]/40 uppercase tracking-wider mb-6">Lo que verás:</p>
            <div className="space-y-3">
              {[
                "Crear un escenario de ventas en 30 segundos",
                "Lanzar 100 conversaciones simultáneas",
                "Ver cómo diferentes personas reaccionan diferente",
                "Identificar exactamente dónde falla tu agente",
                "Aplicar una mejora sugerida por IA",
                "Comparar resultados: antes vs después",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-[#E8E4D9]/60">
                  <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-[#E8E4D9]/40" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="min-h-screen flex items-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4">
              No solo encontramos bugs
            </h2>
            <p className="text-xl text-[#E8E4D9]/50">
              Medimos lo que importa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-[#E8E4D9]/10">
            {/* Conversion */}
            <div className="p-8 bg-[#0A0A0A]">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-medium">Conversión</h3>
                <span className="text-[10px] px-2 py-0.5 bg-green-400/10 text-green-400 uppercase tracking-wider">Métrica Maestra</span>
              </div>
              <p className="text-[#E8E4D9]/50 mb-6 text-sm">
                ¿Logró el objetivo? (agendar reunión, resolver problema, completar compra)
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">100%</span>
                  <span className="text-[#E8E4D9]/40">Objetivo cumplido con fecha/hora específica</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400">50%</span>
                  <span className="text-[#E8E4D9]/40">Siguiente paso vago sin compromiso</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">0%</span>
                  <span className="text-[#E8E4D9]/40">Usuario terminó sin resultado</span>
                </div>
              </div>
            </div>

            {/* Qualification */}
            <div className="p-8 bg-[#0A0A0A]">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-medium">Calificación</h3>
                <span className="text-[10px] px-2 py-0.5 bg-blue-400/10 text-blue-400 uppercase tracking-wider">Diagnóstico</span>
              </div>
              <p className="text-[#E8E4D9]/50 mb-6 text-sm">
                ¿Hizo las preguntas correctas antes de vender?
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 shrink-0">Alta (80-100%)</span>
                  <span className="text-[#E8E4D9]/40">5+ preguntas BANT</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 shrink-0">Media (40-70%)</span>
                  <span className="text-[#E8E4D9]/40">2-4 preguntas, calificación parcial</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 shrink-0">Baja (0-30%)</span>
                  <span className="text-[#E8E4D9]/40">Vendió a ciegas sin entender al cliente</span>
                </div>
              </div>
            </div>

            {/* Satisfaction */}
            <div className="p-8 bg-[#0A0A0A]">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-medium">Satisfacción</h3>
              </div>
              <p className="text-[#E8E4D9]/50 text-sm">
                ¿El usuario quedó feliz o frustrado?
              </p>
            </div>

            {/* Efficiency */}
            <div className="p-8 bg-[#0A0A0A]">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-medium">Eficiencia</h3>
              </div>
              <p className="text-[#E8E4D9]/50 text-sm">
                ¿Cuántos mensajes tomó? ¿Cuánto costó en tokens?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-[50vh] flex items-center justify-center px-6 py-24 border-t border-[#E8E4D9]/10">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-8">
            ¿Listo para probarlo?
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            {/* QR Code */}
            <div className="p-4 bg-white rounded-lg">
              <img
                src="/qr.jpeg"
                alt="Scan to try Cadence"
                className="w-32 h-32 md:w-40 md:h-40"
              />
            </div>

            <div className="text-left">
              <p className="text-[#E8E4D9]/50 text-sm mb-4">Escanea para probar</p>
              <Link
                href="/app"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#E8E4D9] text-[#0A0A0A] text-sm font-medium hover:bg-[#E8E4D9]/90 transition-colors"
              >
                Comenzar ahora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Large Wordmark */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden">
        <h1
          className="text-[80px] sm:text-[140px] md:text-[200px] lg:text-[280px] font-bold leading-none tracking-[-0.04em] translate-y-[25%]"
          style={{
            WebkitTextStroke: "1px rgba(232, 228, 217, 0.1)",
            color: "transparent",
          }}
        >
          cadence
        </h1>
      </div>
    </div>
  )
}

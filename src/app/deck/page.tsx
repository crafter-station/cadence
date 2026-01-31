"use client"

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
} from "lucide-react"

export default function DeckPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            Cadence
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-light">
            Testing inteligente para agentes de IA
          </p>
        </div>
      </section>

      {/* The Problem - Story */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-card/30">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16">
            Todos hemos estado ahí
          </h2>

          <div className="space-y-8 text-xl md:text-2xl text-muted-foreground leading-relaxed">
            <p>
              Lanzas tu chatbot. Funciona <span className="text-foreground font-medium">perfecto</span> en desarrollo.
            </p>
            <p>
              Luego un cliente escribe:
            </p>
            <p className="text-foreground font-mono bg-secondary/50 px-4 py-3 rounded-lg border border-border">
              "ayudame porfavor urgente!!! mi cuenta"
            </p>
            <p>
              Y tu agente... <span className="text-destructive font-medium">no sabe qué hacer.</span>
            </p>
          </div>

          <div className="pt-12 border-t border-border">
            <p className="text-2xl md:text-3xl text-foreground font-light text-center">
              El problema no es tu código.<br />
              <span className="text-muted-foreground">Es que nunca testeaste cómo se comporta tu IA con usuarios reales.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Reality of AI Development */}
      <section className="min-h-screen flex items-center px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16">
            La realidad del desarrollo de IA
          </h2>

          <div className="space-y-6">
            {[
              { icon: Bug, text: "Cambias un prompt", result: "rompes 15 flujos sin darte cuenta" },
              { icon: Clock, text: "Testas manualmente", result: "cubres 10 escenarios, tus usuarios encuentran 100" },
              { icon: Zap, text: "Despliegas con confianza", result: "los casos extremos aparecen el fin de semana" },
              { icon: AlertCircle, text: "Debuggeas en producción", result: "mientras tus usuarios esperan" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-6 p-6 rounded-xl bg-card/50 border border-border/50"
              >
                <item.icon className="w-6 h-6 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <span className="text-foreground font-medium">{item.text}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="text-destructive/80">{item.result}</span>
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
      <section className="min-h-screen flex items-center px-6 py-24 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Cadence cambia el juego
          </h2>

          <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            Imagina poder testear tu agente de IA contra <span className="text-foreground font-medium">miles de conversaciones</span> antes de que tus usuarios las tengan.
          </p>

          <div className="text-left max-w-xl mx-auto">
            <p className="text-lg text-muted-foreground mb-6">Con personas que simulan:</p>
            <div className="space-y-4">
              {[
                { persona: "El ejecutivo frustrado", detail: "que no tiene tiempo" },
                { persona: "La abuela confundida", detail: "que necesita ayuda" },
                { persona: "El desarrollador", detail: "que busca precisión técnica" },
                { persona: "El cliente escéptico", detail: "que no confía fácilmente" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30"
                >
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="text-foreground font-medium">{item.persona}</span>
                    <span className="text-muted-foreground"> {item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex items-center justify-center gap-3 text-xl text-muted-foreground">
            <span>Todo esto corriendo en paralelo.</span>
            <Coffee className="w-5 h-5" />
            <span className="text-foreground">Mientras tomas un café.</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="min-h-screen flex items-center px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16">
            Cómo funciona
          </h2>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Define tu escenario",
                example: '"Agente de ventas intenta agendar reunión con prospecto"',
                icon: Target,
              },
              {
                step: "2",
                title: "Elige tus personas",
                example: "Selecciona qué tipos de usuarios quieres simular",
                icon: Users,
              },
              {
                step: "3",
                title: "Déjanos correr",
                example: "Lanzamos cientos de conversaciones en paralelo",
                icon: Zap,
              },
              {
                step: "4",
                title: "Ve qué falló (y por qué)",
                example: "No solo errores. Patrones. Insights. Soluciones.",
                icon: BarChart3,
              },
              {
                step: "5",
                title: "Mejora automáticamente",
                example: "Nuestra IA analiza las fallas y te sugiere cómo arreglar tu prompt",
                icon: Sparkles,
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{item.step}</span>
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-xl font-medium">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Demo
          </h2>
          <p className="text-xl text-muted-foreground mb-16">
            Veámoslo en vivo
          </p>

          <div className="aspect-video bg-secondary/30 rounded-2xl border border-border/50 flex items-center justify-center mb-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">Demo en vivo</p>
            </div>
          </div>

          <div className="text-left max-w-xl mx-auto">
            <p className="text-lg font-medium mb-6">Lo que verás:</p>
            <div className="space-y-3">
              {[
                "Crear un escenario de ventas en 30 segundos",
                "Lanzar 100 conversaciones simultáneas",
                "Ver cómo diferentes personas reaccionan diferente",
                "Identificar exactamente dónde falla tu agente",
                "Aplicar una mejora sugerida por IA",
                "Comparar resultados: antes vs después",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-muted-foreground">
                  <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="min-h-screen flex items-center px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              No solo encontramos bugs
            </h2>
            <p className="text-xl text-muted-foreground">
              Medimos lo que importa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Conversion */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-chart-1" />
                <h3 className="text-xl font-semibold">Conversión</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-chart-1/10 text-chart-1">Métrica Maestra</span>
              </div>
              <p className="text-muted-foreground mb-6">
                ¿Logró el objetivo? (agendar reunión, resolver problema, completar compra)
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-chart-1" />
                  <span className="text-chart-1 font-medium">100%</span>
                  <span className="text-muted-foreground">Objetivo cumplido con fecha/hora específica</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-chart-5" />
                  <span className="text-chart-5 font-medium">50%</span>
                  <span className="text-muted-foreground">Siguiente paso vago sin compromiso</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-chart-3" />
                  <span className="text-chart-3 font-medium">0%</span>
                  <span className="text-muted-foreground">Usuario terminó sin resultado</span>
                </div>
              </div>
            </div>

            {/* Qualification */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-chart-2" />
                <h3 className="text-xl font-semibold">Calificación</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-chart-2/10 text-chart-2">Diagnóstico</span>
              </div>
              <p className="text-muted-foreground mb-6">
                ¿Hizo las preguntas correctas antes de vender?
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-chart-1 font-medium shrink-0">Alta (80-100%)</span>
                  <span className="text-muted-foreground">5+ preguntas BANT (Budget, Authority, Need, Timeline)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-chart-5 font-medium shrink-0">Media (40-70%)</span>
                  <span className="text-muted-foreground">2-4 preguntas, calificación parcial</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-chart-3 font-medium shrink-0">Baja (0-30%)</span>
                  <span className="text-muted-foreground">Vendió a ciegas sin entender al cliente</span>
                </div>
              </div>
            </div>

            {/* Satisfaction */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-chart-4" />
                <h3 className="text-xl font-semibold">Satisfacción</h3>
              </div>
              <p className="text-muted-foreground">
                ¿El usuario quedó feliz o frustrado?
              </p>
            </div>

            {/* Efficiency */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-chart-5" />
                <h3 className="text-xl font-semibold">Eficiencia</h3>
              </div>
              <p className="text-muted-foreground">
                ¿Cuántos mensajes tomó? ¿Cuánto costó en tokens?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-[50vh] flex items-center justify-center px-6 py-24 bg-card/30">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            ¿Listo para probarlo?
          </h2>
          <a
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Comenzar ahora
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>Cadence</p>
        </div>
      </footer>
    </div>
  )
}

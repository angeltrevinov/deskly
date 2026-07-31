import { ArrowRight, Layers3, Palette, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Componentes reutilizables",
    description: "Base lista para crecer con la misma API visual y composable de shadcn/ui.",
    icon: Layers3,
  },
  {
    title: "Accesibilidad razonable",
    description: "Arranca con patrones y estados de interacción consistentes para el dashboard.",
    icon: ShieldCheck,
  },
  {
    title: "Customización ligera",
    description: "Tokens CSS, Tailwind y componentes editables sin depender de una caja negra.",
    icon: Palette,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
          <div className="flex flex-col gap-6 md:max-w-3xl">
            <span className="w-fit rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Deskly UI Foundation
            </span>
            <div className="space-y-4">
              <h1 className="font-[var(--font-heading)] text-4xl font-bold tracking-tight md:text-6xl">
                shadcn/ui quedó integrado sobre Next.js para acelerar el frontend de Deskly.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                La app ya cuenta con Tailwind, tokens de diseño, utilidades y componentes base
                editables para construir dashboard, detalle SSR y flujos en tiempo real sin
                meter una dependencia visual cerrada.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2">
                Continuar con dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Revisar componentes base
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-white/70 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-[var(--font-heading)] text-2xl">{title}</CardTitle>
                <CardDescription className="text-base leading-7 text-muted-foreground">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="px-0 text-primary hover:text-primary">
                  Ver siguiente paso
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
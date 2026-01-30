"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Clock,
  Shield,
  AlertTriangle,
  ChevronRight,
  Star,
  MapPin,
  Zap,
  CheckCircle2,
  ArrowRight,
  Wrench,
  Droplets,
  Flame,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";

const panneTypes = [
  { icon: Droplets, label: "Fuite d'eau", color: "text-blue-700", bg: "bg-blue-100" },
  { icon: Wrench, label: "WC bouché", color: "text-amber-700", bg: "bg-amber-100" },
  { icon: Flame, label: "Ballon d'eau chaude", color: "text-orange-700", bg: "bg-orange-100" },
  { icon: Droplets, label: "Canalisation", color: "text-cyan-700", bg: "bg-cyan-100" },
  { icon: Wrench, label: "Robinetterie", color: "text-purple-700", bg: "bg-purple-100" },
  { icon: Zap, label: "Autre urgence", color: "text-red-700", bg: "bg-red-100" },
];

const stats = [
  { value: "500+", label: "Artisans vérifiés" },
  { value: "2 min", label: "Temps de réponse" },
  { value: "98%", label: "Satisfaction" },
  { value: "24/7", label: "Disponibilité" },
];

const steps = [
  {
    number: "1",
    title: "Décrivez votre problème",
    description: "Remplissez le formulaire en 30 secondes",
  },
  {
    number: "2",
    title: "Recevez un appel",
    description: "Un artisan qualifié vous contacte sous 2 min",
  },
  {
    number: "3",
    title: "Intervention rapide",
    description: "L'artisan intervient selon vos disponibilités",
  },
];

const testimonials = [
  {
    name: "Marie L.",
    city: "Paris",
    text: "Fuite à 23h, un plombier m'a rappelée en 1 minute. Intervention impeccable !",
    rating: 5,
  },
  {
    name: "Thomas D.",
    city: "Lyon",
    text: "Service réactif et artisan professionnel. Je recommande vivement.",
    rating: 5,
  },
  {
    name: "Sophie M.",
    city: "Marseille",
    text: "WC bouché le dimanche matin, problème résolu en moins d'une heure.",
    rating: 5,
  },
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-blue-50/50 to-white">
      {/* Header moderne */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Plombier Urgent
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/artisan/login"
              className="hidden sm:flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              <Users className="h-4 w-4" />
              Espace Artisan
            </Link>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25" asChild>
              <Link href="/demande">
                Urgence
                <Zap className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge urgence animé */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-red-50 border border-red-100 text-red-600 text-sm font-semibold animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Intervention urgente 24h/24 - 7j/7
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900">
                Un <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">plombier urgent</span>
                <br className="hidden sm:block" />
                à votre porte en{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">2 minutes</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C50 4 150 4 198 10" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                        <stop stopColor="#2563eb"/>
                        <stop offset="1" stopColor="#06b6d4"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Décrivez votre problème, un artisan qualifié et vérifié vous rappelle immédiatement.
                <span className="font-semibold text-slate-800"> Devis gratuit, sans engagement.</span>
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="text-lg h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
                  asChild
                >
                  <Link href="/demande">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    J'ai une urgence
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg h-14 px-8 border-2 hover:bg-slate-50"
                  asChild
                >
                  <Link href="tel:0123456789">
                    <Phone className="h-5 w-5 mr-2" />
                    01 23 45 67 89
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Artisans certifiés
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Devis transparent
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Garantie satisfaction
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 border-y bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Types de pannes */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Quel est votre problème ?
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                Sélectionnez le type de panne pour être mis en relation avec un spécialiste
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {panneTypes.map((panne) => (
                <Link key={panne.label} href="/demande">
                  <Card className="group cursor-pointer bg-white/90 backdrop-blur-sm border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/15 hover:scale-[1.02] transition-all duration-200">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${panne.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <panne.icon className={`h-7 w-7 ${panne.color}`} />
                      </div>
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {panne.label}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16 md:py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                3 étapes simples pour une intervention rapide
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent" />
                  )}
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-slate-900/[0.08] border border-slate-200/80 relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-xl flex items-center justify-center mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Ils nous font confiance
              </h2>
              <p className="text-slate-600">Plus de 10 000 interventions réalisées</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-blue-100 shadow-xl shadow-blue-600/10 bg-gradient-to-br from-white to-blue-50/30">
                <CardContent className="p-8 md:p-10 text-center">
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-xl md:text-2xl text-slate-700 mb-6 italic">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    <span className="font-semibold">{testimonials[currentTestimonial].name}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {testimonials[currentTestimonial].city}
                    </div>
                  </div>
                  {/* Dots indicator */}
                  <div className="flex justify-center gap-2 mt-6">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentTestimonial(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentTestimonial ? "w-6 bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
          {/* Decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 text-center relative">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Une urgence ? Ne perdez plus de temps
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Décrivez votre problème et recevez un appel dans les 2 minutes.
                <br />
                <span className="font-semibold text-white">Service 100% gratuit, sans engagement.</span>
              </p>
              <Button
                size="lg"
                className="text-lg h-14 px-10 bg-white text-blue-600 hover:bg-blue-50 shadow-xl transition-all hover:scale-105"
                asChild
              >
                <Link href="/demande">
                  Demander une intervention
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-12 bg-white border-t">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Artisans assurés</h3>
                  <p className="text-sm text-slate-500">Garantie décennale et RC Pro</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Disponible 24h/24</h3>
                  <p className="text-sm text-slate-500">Week-ends et jours fériés</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">4.9/5 sur Google</h3>
                  <p className="text-sm text-slate-500">+2000 avis clients vérifiés</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer moderne */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-400" />
                </div>
                <span className="font-bold text-xl">Plombier Urgent</span>
              </Link>
              <p className="text-slate-400 text-sm max-w-sm">
                Service de mise en relation avec des artisans plombiers qualifiés.
                Disponible 24h/24, 7j/7 partout en France.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/demande" className="hover:text-white transition-colors">Demande urgente</Link></li>
                <li><Link href="/artisan/login" className="hover:text-white transition-colors">Espace artisan</Link></li>
                <li><Link href="/artisan/inscription" className="hover:text-white transition-colors">Devenir partenaire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/cgv" className="hover:text-white transition-colors">CGV</Link></li>
                <li><Link href="/cgv" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="/cgv" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Plombier Urgent - Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}

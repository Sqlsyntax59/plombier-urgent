"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  Users,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const panneTypes = [
  {
    label: "Fuite d'eau",
    description: "Fuite visible ou cachée",
    gradient: "from-blue-500 to-cyan-400",
    image: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=800&q=80",
  },
  {
    label: "WC bouché",
    description: "Débouchage express",
    gradient: "from-amber-500 to-orange-400",
    image: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800&q=80",
  },
  {
    label: "Ballon d'eau chaude",
    description: "Panne ou remplacement",
    gradient: "from-red-500 to-orange-400",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
  },
  {
    label: "Canalisation",
    description: "Bouchée ou cassée",
    gradient: "from-emerald-500 to-teal-400",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
  },
  {
    label: "Robinetterie",
    description: "Réparation ou changement",
    gradient: "from-violet-500 to-purple-400",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
  },
  {
    label: "Autre urgence",
    description: "Toute intervention",
    gradient: "from-rose-500 to-pink-400",
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80",
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Artisans vérifiés", icon: Users },
  { value: 2, suffix: " min", label: "Temps de réponse", icon: Clock },
  { value: 98, suffix: "%", label: "Satisfaction client", icon: Star },
  { value: 24, suffix: "/7", label: "Disponibilité", icon: Shield },
];

const steps = [
  {
    number: "01",
    title: "Décrivez votre urgence",
    description: "Formulaire simple en 30 secondes. Décrivez votre problème et votre localisation.",
    icon: AlertTriangle,
  },
  {
    number: "02",
    title: "Appel en 2 minutes",
    description: "Un artisan qualifié et disponible près de chez vous vous rappelle immédiatement.",
    icon: Phone,
  },
  {
    number: "03",
    title: "Intervention express",
    description: "Devis transparent sur place. Intervention rapide selon vos disponibilités.",
    icon: Wrench,
  },
];

const testimonials = [
  {
    name: "Marie L.",
    city: "Paris 15ème",
    text: "Fuite d'eau à 23h un dimanche. En 90 secondes j'avais un plombier au téléphone. Intervention impeccable, prix honnête. Je recommande à 100% !",
    rating: 5,
    date: "Il y a 2 jours",
    avatar: "M",
  },
  {
    name: "Thomas D.",
    city: "Lyon 6ème",
    text: "WC bouché le matin d'un jour férié. Le plombier est arrivé en 45 minutes. Problème réglé en une heure. Service au top !",
    rating: 5,
    date: "Il y a 1 semaine",
    avatar: "T",
  },
  {
    name: "Sophie M.",
    city: "Marseille",
    text: "Ballon d'eau chaude en panne avec un bébé à la maison. Urgence prise en charge immédiatement. Merci pour votre réactivité !",
    rating: 5,
    date: "Il y a 3 jours",
    avatar: "S",
  },
];

// Hook pour animation des compteurs
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
}

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Observer pour déclencher l'animation des stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotation des témoignages
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const stat1 = useCountUp(stats[0].value, 2000, statsVisible);
  const stat2 = useCountUp(stats[1].value, 1500, statsVisible);
  const stat3 = useCountUp(stats[2].value, 2000, statsVisible);
  const stat4 = useCountUp(stats[3].value, 1500, statsVisible);
  const statValues = [stat1, stat2, stat3, stat4];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Gradient background animé */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0f1a] to-[#0a0f1a]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      {/* Header glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0f1a]/80 border-b border-white/5">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Droplets className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg md:text-xl tracking-tight">
                Plombier<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Urgent</span>
              </span>
              <span className="text-[10px] md:text-xs text-slate-500 font-medium tracking-widest uppercase">24h/24 • 7j/7</span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 md:gap-6">
            <Link
              href="/artisan/login"
              className="hidden sm:flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              <Users className="h-4 w-4" />
              Espace Pro
            </Link>
            <Button
              size="sm"
              className="relative group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-lg shadow-orange-500/25 text-sm md:text-base px-4 md:px-6"
              asChild
            >
              <Link href="/demande">
                <span className="absolute inset-0 rounded-md bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-100 blur transition-opacity" />
                <span className="relative flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Urgence
                </span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge animé */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="text-sm font-semibold text-orange-300">Intervention urgente disponible maintenant</span>
              </div>

              {/* Titre principal avec effet */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.1]">
                <span className="text-white">Un plombier à</span>
                <br />
                <span className="text-white">votre porte en </span>
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 animate-gradient-x">
                    2 minutes
                  </span>
                  <span className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-2xl" />
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                Décrivez votre urgence. Un artisan <span className="text-white font-medium">qualifié et vérifié</span> vous rappelle immédiatement.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button
                  size="lg"
                  className="relative group text-lg h-16 px-10 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 border-0 shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40 w-full sm:w-auto"
                  asChild
                >
                  <Link href="/demande">
                    <span className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-400 to-cyan-300 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                    <span className="relative flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5" />
                      J'ai une urgence
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg h-16 px-10 border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm w-full sm:w-auto"
                  asChild
                >
                  <Link href="tel:0123456789">
                    <Phone className="h-5 w-5 mr-3" />
                    01 23 45 67 89
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-500">
                {[
                  { icon: CheckCircle2, text: "Artisans certifiés RGE" },
                  { icon: Shield, text: "Garantie décennale" },
                  { icon: Sparkles, text: "Devis gratuit" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 group">
                    <badge.icon className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-slate-300 transition-colors">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs text-slate-600 uppercase tracking-widest">Découvrir</span>
            <div className="w-6 h-10 rounded-full border-2 border-slate-700 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-slate-500 rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-12 md:py-16 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="relative group text-center p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-white/10 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                  <stat.icon className="h-6 w-6 mx-auto mb-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <div className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                    {statValues[index]}{stat.suffix}
                  </div>
                  <div className="text-sm text-slate-500 mt-2 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Types de pannes */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">
                Services
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                Quel est votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">problème</span> ?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-lg">
                Sélectionnez le type d'urgence pour être mis en relation avec un spécialiste
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {panneTypes.map((panne, index) => (
                <Link
                  key={panne.label}
                  href="/demande"
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300 group-hover:translate-y-[-4px]">
                    {/* Image container */}
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      <Image
                        src={panne.image}
                        alt={panne.label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${panne.gradient} opacity-40 group-hover:opacity-60 transition-opacity`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
                    </div>
                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-bold text-xl md:text-2xl text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-300 transition-all">
                        {panne.label}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">{panne.description}</p>
                      <div className="flex items-center text-sm font-medium text-blue-400 group-hover:text-cyan-300 transition-colors">
                        <span>Demander un devis</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-20 md:py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />

          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                Processus
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                Comment <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">ça marche</span> ?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-lg">
                3 étapes simples pour une intervention express
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
                {/* Ligne de connexion */}
                <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-blue-500/50" />

                {steps.map((step, index) => (
                  <div key={step.number} className="relative group">
                    <div className="relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:translate-y-[-8px]">
                      {/* Numéro */}
                      <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/30">
                        {step.number}
                      </div>

                      {/* Icône centrale */}
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                        <step.icon className="h-8 w-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>

                      <h3 className="font-bold text-xl text-white mb-3 text-center">{step.title}</h3>
                      <p className="text-slate-500 text-center leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/20">
                Témoignages
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                Ils nous font <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">confiance</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-lg">
                Plus de 10 000 interventions réalisées avec succès
              </p>
            </div>

            <div className="max-w-3xl mx-auto relative">
              {/* Cards témoignages */}
              <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-3xl" />
                <div className="relative p-8 md:p-12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl">
                  {/* Étoiles */}
                  <div className="flex justify-center gap-1 mb-8">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 md:h-8 md:w-8 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Citation */}
                  <blockquote className="text-xl md:text-2xl lg:text-3xl text-white text-center mb-8 font-light leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>

                  {/* Auteur */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-lg">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">{testimonials[currentTestimonial].name}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {testimonials[currentTestimonial].city}
                        <span className="text-slate-600">•</span>
                        {testimonials[currentTestimonial].date}
                      </div>
                    </div>
                  </div>

                  {/* Navigation dots */}
                  <div className="flex justify-center gap-2 mt-8">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentTestimonial(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === currentTestimonial
                            ? "w-8 bg-gradient-to-r from-amber-400 to-orange-400"
                            : "w-2 bg-slate-700 hover:bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[128px]" />
          </div>

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge urgence */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-bold text-white">Artisans disponibles maintenant</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
                Une urgence ?<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Ne perdez plus de temps</span>
              </h2>

              <p className="text-lg md:text-xl text-blue-100/80 mb-10 max-w-xl mx-auto">
                Décrivez votre problème et recevez un appel dans les 2 minutes.
                <span className="block mt-2 font-semibold text-white">Service 100% gratuit, sans engagement.</span>
              </p>

              <Button
                size="lg"
                className="relative group text-lg h-16 px-12 bg-white text-blue-600 hover:bg-blue-50 shadow-2xl shadow-white/20 transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link href="/demande">
                  <span className="relative flex items-center gap-3 font-bold">
                    Demander une intervention
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 border-t border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Shield, title: "Artisans assurés", desc: "Garantie décennale et RC Pro vérifiées", color: "from-emerald-500 to-teal-400" },
                { icon: Clock, title: "Disponible 24h/24", desc: "Week-ends et jours fériés inclus", color: "from-blue-500 to-cyan-400" },
                { icon: Star, title: "4.9/5 sur Google", desc: "+2000 avis clients vérifiés", color: "from-amber-500 to-orange-400" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer premium */}
      <footer className="border-t border-white/5 bg-[#070a12]">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Logo & description */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl">
                    Plombier<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Urgent</span>
                  </span>
                </div>
              </Link>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Service de mise en relation avec des artisans plombiers qualifiés et vérifiés.
                Disponible 24h/24, 7j/7 partout en France.
              </p>
              <div className="flex gap-4 mt-6">
                {/* Social icons placeholder */}
                {['facebook', 'twitter', 'instagram'].map((social) => (
                  <div key={social} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-slate-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { href: "/demande", label: "Demande urgente" },
                  { href: "/artisan/login", label: "Espace artisan" },
                  { href: "/artisan/inscription", label: "Devenir partenaire" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-slate-500 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { href: "/cgv", label: "Conditions générales" },
                  { href: "/cgv", label: "Mentions légales" },
                  { href: "/cgv", label: "Confidentialité" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-slate-500 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} PlombierUrgent - Tous droits réservés
            </div>
            <div className="text-sm text-slate-600">
              Fait avec 💙 en France
            </div>
          </div>
        </div>
      </footer>

      {/* CSS pour l'animation du gradient */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

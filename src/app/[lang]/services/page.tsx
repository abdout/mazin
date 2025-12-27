import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { SiteHeader } from "@/components/template/site-header"
import { Footer } from "@/components/marketing/footer"
import Image from "next/image"
import Link from "next/link"
import { Ship, Plane, Truck, CheckCircle, Users, Zap, DollarSign, MapPin, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)
  const { servicesPage } = dict.marketing

  const serviceIcons = {
    sea: Ship,
    air: Plane,
    ground: Truck,
  }

  const serviceImages = {
    sea: "/ship.jpg",
    air: "/plane.jpg",
    ground: "/contianer.jpg",
  }

  const advantageIcons = [Users, Zap, DollarSign, MapPin, Headphones]

  return (
    <>
      <SiteHeader dictionary={dict} />
      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="relative h-[50vh] md:h-[60vh]">
          <Image
            src="/ship.jpg"
            alt="Services"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative h-full flex items-center"
            style={{ paddingInline: "var(--container-padding)" }}
          >
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold tracking-wider text-white/80 uppercase mb-4 px-4 py-2 border border-white/30 rounded-full">
                {servicesPage.hero.badge}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
                {servicesPage.hero.title}
              </h1>
              <p className="text-lg text-white/90">
                {servicesPage.hero.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Services Detail Section */}
        <section className="py-20 bg-background">
          <div style={{ paddingInline: "var(--container-padding)" }}>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold tracking-wider text-primary uppercase mb-4">
                {servicesPage.overview.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                {servicesPage.overview.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {servicesPage.overview.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {(["sea", "air", "ground"] as const).map((key) => {
                const service = servicesPage.serviceDetails[key]
                const Icon = serviceIcons[key]
                const image = serviceImages[key]

                return (
                  <div
                    key={key}
                    className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48">
                      <Image
                        src={image}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 start-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {service.description}
                      </p>
                      <ul className="space-y-2">
                        {service.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 bg-muted">
          <div style={{ paddingInline: "var(--container-padding)" }}>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold tracking-wider text-primary uppercase mb-4">
                {servicesPage.process.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                {servicesPage.process.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {servicesPage.process.subtitle}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicesPage.process.steps.slice(0, 4).map((step, index) => (
                <div
                  key={index}
                  className="relative bg-card rounded-2xl p-6 shadow-sm"
                >
                  <span className="text-5xl font-bold text-primary/20 absolute top-4 end-4">
                    {step.number}
                  </span>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-foreground mb-2 pt-8">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {servicesPage.process.steps.slice(4).map((step, index) => (
                <div
                  key={index + 4}
                  className="relative bg-card rounded-2xl p-6 shadow-sm"
                >
                  <span className="text-5xl font-bold text-primary/20 absolute top-4 end-4">
                    {step.number}
                  </span>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-foreground mb-2 pt-8">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages Section */}
        <section className="py-20 bg-background">
          <div style={{ paddingInline: "var(--container-padding)" }}>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-semibold tracking-wider text-primary uppercase mb-4">
                {servicesPage.advantages.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                {servicesPage.advantages.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {servicesPage.advantages.subtitle}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {servicesPage.advantages.items.map((item, index) => {
                const Icon = advantageIcons[index] || CheckCircle
                return (
                  <div
                    key={index}
                    className="text-center p-6 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary">
          <div
            style={{ paddingInline: "var(--container-padding)" }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              {servicesPage.cta.title}
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              {servicesPage.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/${lang}/dashboard`}>
                  {servicesPage.cta.quoteButton}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href={`/${lang}/track`}>
                  {servicesPage.cta.trackButton}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer dictionary={dict} lang={lang} />
    </>
  )
}

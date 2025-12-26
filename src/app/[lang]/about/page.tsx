import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { SiteHeader } from "@/components/template/site-header"
import { Footer } from "@/components/marketing/footer"
import Image from "next/image"

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)
  const { about } = dict

  const goalItems = [
    { icon: "/category-01.svg", bgColor: "bg-[#D97757]" },
    { icon: "/category-06.svg", bgColor: "bg-[#6A9BCC]" },
    { icon: "/category-03.svg", bgColor: "bg-[#BCD1CA]" },
  ]

  return (
    <>
      <SiteHeader dictionary={dict} />
      <main className="min-h-screen pt-16">
        <div style={{ paddingInline: 'var(--container-padding)' }} className="py-16">
            {/* Who We Are & Why Us Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-28 mb-20">
              {/* Who We Are */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="text-primary text-sm font-medium tracking-widest uppercase">
                    {about.sections.who.subtitle}
                  </div>
                  <h2 className="text-foreground text-5xl font-bold leading-tight">
                    {about.sections.who.title}
                  </h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {about.sections.who.description}
                  </p>
                </div>
                <div className="mt-8">
                  <Image
                    src="/abdout.png"
                    alt="Port Sudan shipping"
                    width={500}
                    height={250}
                    className="w-full h-[600px] rounded-lg object-cover"
                  />
                </div>
              </div>

              {/* Why Us */}
              <div className="space-y-8 mt-24">
                <div className="space-y-6">
                  <div className="text-primary text-sm font-medium tracking-widest uppercase">
                    {about.sections.why.subtitle}
                  </div>
                  <h2 className="text-foreground text-5xl font-bold leading-tight">
                    {about.sections.why.title}
                  </h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {about.sections.why.description}
                  </p>
                </div>
                <div className="mt-8">
                  <Image
                    src="/contianer.jpg"
                    alt="Logistics teamwork"
                    width={500}
                    height={250}
                    className="w-full h-[600px] rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Mission Section */}
            <div className="bg-muted rounded-3xl p-12">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="space-y-6">
                  <div className="text-primary text-sm font-medium tracking-widest uppercase">
                    {about.sections.mission.subtitle}
                  </div>
                  <h2 className="text-foreground text-5xl font-bold leading-tight">
                    {about.sections.mission.title}
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
                    {about.sections.mission.description}
                  </p>
                </div>

                {/* Goals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                  {about.goals.map((goal, index) => (
                    <div key={index} className="space-y-4">
                      <div className={`w-24 h-24 ${goalItems[index]?.bgColor} rounded-2xl flex items-center justify-center mx-auto`}>
                        <Image
                          src={goalItems[index]?.icon || ""}
                          alt=""
                          width={64}
                          height={64}
                          className="dark:invert"
                        />
                      </div>
                      <h3 className="text-foreground text-xl font-semibold">
                        {goal.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {goal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Board of Directors Section */}
            <div className="mt-20">
              <div className="text-center space-y-6 mb-12">
                <div className="text-primary text-sm font-medium tracking-widest uppercase">
                  {about.boardOfDirectors.subtitle}
                </div>
                <h2 className="text-foreground text-5xl font-bold leading-tight">
                  {about.boardOfDirectors.title}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {about.boardOfDirectors.description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {about.boardOfDirectors.members.map((member, index) => {
                  const images = [
                    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
                  ]
                  return (
                    <div key={index} className="text-center space-y-3 md:space-y-4">
                      <div className="relative aspect-square w-full max-w-48 mx-auto">
                        <Image
                          src={images[index] || images[0]}
                          alt={member.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <h3 className="font-semibold text-sm md:text-lg text-foreground">
                          {member.name}
                        </h3>
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">
                          {member.position}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
        </div>
      </main>
      <Footer dictionary={dict} lang={lang} />
    </>
  )
}

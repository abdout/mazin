import Image from 'next/image'

const sponsors = [
  { name: 'Faisal', src: '/marketing/sponser/faisal.png' },
  { name: 'WHO', src: '/marketing/sponser/who.svg' },
  { name: 'MTDT', src: '/marketing/sponser/mtdt.png' },
  { name: 'Zain', src: '/marketing/sponser/zain.png' },
  { name: 'Khartoum', src: '/marketing/sponser/khartoum.png' },
  { name: 'USAID', src: '/marketing/sponser/usaid.svg' },
  { name: 'Dal', src: '/marketing/sponser/dal.png' },
  { name: '249', src: '/marketing/sponser/249.png' },
  { name: 'University of Khartoum', src: '/marketing/sponser/uok.png' },
]

function LogoItem({ sponsor }: { sponsor: (typeof sponsors)[0] }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-6 sm:px-8 md:px-10 lg:px-12">
      <Image
        src={sponsor.src}
        alt={sponsor.name}
        width={140}
        height={70}
        className="h-10 sm:h-10 md:h-11 lg:h-12 w-auto max-w-[110px] sm:max-w-[115px] md:max-w-[130px] lg:max-w-[150px] object-contain grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-300 dark:invert dark:opacity-60 dark:hover:opacity-100"
        unoptimized
        draggable={false}
      />
    </div>
  )
}

export function Partners() {
  return (
    <section className="py-6 sm:py-8 md:py-10 bg-background overflow-hidden">
      <div className="partners-marquee-wrapper">
        <div className="partners-marquee group">
          <div className="partners-marquee-content group-hover:[animation-play-state:paused]">
            {[...sponsors, ...sponsors].map((sponsor, index) => (
              <LogoItem key={index} sponsor={sponsor} />
            ))}
          </div>
          <div
            className="partners-marquee-content group-hover:[animation-play-state:paused]"
            aria-hidden="true"
          >
            {[...sponsors, ...sponsors].map((sponsor, index) => (
              <LogoItem key={`dup-${index}`} sponsor={sponsor} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

'use client';

import Image from 'next/image';
import type { Dictionary } from '@/components/internationalization';

// Member images - indexed by position
const memberImages: Record<number, string> = {
  0: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3",
  1: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  2: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
  3: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3",
};

interface TeamPageProps {
  dictionary: Dictionary;
}

export function TeamPage({ dictionary }: TeamPageProps) {
  const boardContent = dictionary.about.boardOfDirectors;
  // Only show first 4 members on the marketing page
  const teamMembers = boardContent.members.slice(0, 4);
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-foreground text-background">
      <div style={{ paddingInline: 'var(--container-padding)' }}>
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{boardContent.title}</h2>
          <p className="text-background/70">
            {boardContent.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
            >
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 mb-4 md:mb-6 overflow-hidden rounded-full">
                <Image
                  src={memberImages[index] || memberImages[0]}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 text-background">{member.position}</h3>
              <p className="text-sm md:text-base text-background/70">{member.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

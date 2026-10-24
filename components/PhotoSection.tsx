import Image from "next/image";
import { photos } from "@/data/photos";

// Renders nothing while data/photos.ts is empty. Photos without alt text are skipped.
export default function PhotoSection() {
  const items = photos.filter((photo) => photo.src && photo.alt.trim() !== "");
  if (items.length === 0) return null;

  return (
    <section className="bg-navy-alt text-white">
      <div className="wrap py-14 sm:py-20 lg:py-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">On site</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((photo) => (
            <li key={photo.src} className="overflow-hidden rounded-2xl border border-navy-line bg-navy-card">
              <div className="relative aspect-[4/3]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {photo.caption ? (
                <p className="p-4 text-sm leading-relaxed text-body">{photo.caption}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

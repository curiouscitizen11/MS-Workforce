import Image from "next/image";
import { photos } from "@/data/photos";

// Renders nothing while data/photos.ts is empty. Photos without alt text are skipped.
export default function PhotoSection() {
  const items = photos.filter((photo) => photo.src && photo.alt.trim() !== "");
  if (items.length === 0) return null;

  return (
    <section className="bg-navy-alt text-white">
      <div className="wrap section-pad">
        <h2 className="section-title">On site</h2>
        <ul className="card-grid mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((photo) => (
            <li key={photo.src} className="card overflow-hidden p-0">
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
                <p className="p-5 text-small text-body md:p-6">{photo.caption}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

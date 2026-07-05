import Image from "next/image";

export default function EditorialHero({
  image,
  storeName,
}: {
  image: string;
  storeName: string;
}) {
  return (
    <section className="relative w-full h-[55vh] min-h-[380px] overflow-hidden">
      <Image
        src={image}
        alt={storeName}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-brand text-4xl md:text-6xl text-white tracking-tight">
          {storeName}
        </h1>
        <p className="mt-3 text-white/80 text-sm md:text-base max-w-md">
          Descubrí la nueva colección
        </p>
        <a
          href="#destacados"
          className="mt-6 inline-block bg-white text-gray-900 text-sm font-medium px-8 py-3 rounded-lg hover:bg-white/90 transition-colors"
        >
          Ver colección
        </a>
      </div>
    </section>
  );
}

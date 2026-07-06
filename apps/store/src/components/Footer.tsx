"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Mail, Phone, MessageCircle } from "lucide-react";
import type { PublicCategory } from "@/lib/getPublicCategories";
import type { TenantTheme } from "@/config/tenant-themes";
import type { ClientConfig } from "@/config/client";

function getSlug(cat: PublicCategory) {
  return (
    cat.slug ||
    cat.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[\s-]+/g, "-")
  );
}

const HEADING = "text-xs font-semibold uppercase tracking-wider text-white/50 mb-4";
const LINK = "text-sm text-white/75 hover:text-white transition-colors";

export default function Footer({
  categories,
  storeName,
  logo,
  showRepairs,
  contact,
}: {
  categories: PublicCategory[];
  storeName: string;
  logo: TenantTheme["logo"];
  showRepairs: boolean;
  contact: ClientConfig["contact"];
}) {
  const hasContact = Boolean(
    contact.whatsapp || contact.email || contact.phone || contact.instagram || contact.facebook,
  );

  return (
    <footer className="bg-(--tenant-primary) text-(--tenant-on-primary)">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Marca */}
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-block">
            {logo ? (
              <Image
                src={logo.src}
                alt={storeName}
                width={160}
                height={38}
                className={`h-9 w-auto ${logo.invert ? "brightness-0 invert" : ""}`}
              />
            ) : (
              <span className="font-brand text-2xl tracking-tight">{storeName}</span>
            )}
          </Link>
          {contact.description && (
            <p className="mt-4 text-sm text-white/60 leading-relaxed">{contact.description}</p>
          )}
        </div>

        {/* Categorías */}
        {categories.length > 0 && (
          <div>
            <h3 className={HEADING}>Categorías</h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat._id}>
                  <Link href={`/category/${getSlug(cat)}`} className={LINK}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ayuda */}
        <div>
          <h3 className={HEADING}>Ayuda</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href="/search" className={LINK}>Buscar productos</Link>
            </li>
            <li>
              <Link href="/account/orders" className={LINK}>Mis pedidos</Link>
            </li>
            <li>
              <Link href="/account/favorites" className={LINK}>Mis favoritos</Link>
            </li>
            {showRepairs && (
              <li>
                <Link href="/soporte-tecnico" className={LINK}>Soporte técnico</Link>
              </li>
            )}
          </ul>
        </div>

        {/* Contacto */}
        {hasContact && (
          <div>
            <h3 className={HEADING}>Contacto</h3>
            <ul className="space-y-2.5">
              {contact.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${LINK} flex items-center gap-2`}
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className={`${LINK} flex items-center gap-2`}>
                    <Mail className="w-4 h-4 shrink-0" /> {contact.email}
                  </a>
                </li>
              )}
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone}`} className={`${LINK} flex items-center gap-2`}>
                    <Phone className="w-4 h-4 shrink-0" /> {contact.phone}
                  </a>
                </li>
              )}
            </ul>
            {(contact.instagram || contact.facebook) && (
              <div className="flex items-center gap-3 mt-5">
                {contact.instagram && (
                  <a
                    href={contact.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {contact.facebook && (
                  <a
                    href={contact.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-white/50 text-center md:text-left">
          © {new Date().getFullYear()} {storeName} — Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}

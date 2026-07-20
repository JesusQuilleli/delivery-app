import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/51999999999"
      target="_blank"
      rel="noreferrer"
      aria-label="Pedir por WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground pl-4 pr-5 py-3 font-semibold shadow-lg hover:scale-105 transition"
    >
      <span className="grid place-items-center w-8 h-8 rounded-full bg-primary-foreground/15">
        <MessageCircle className="w-5 h-5" />
      </span>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}

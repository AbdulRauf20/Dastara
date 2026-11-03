import { buildGreetingUrl } from "@/lib/whatsapp";

/** Floating WhatsApp button, visible on all breakpoints, bottom-right. */
export function WhatsAppFloat({ businessNumber }: { businessNumber: string }) {
  const href = buildGreetingUrl(businessNumber);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with DASTARA on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.117.555 4.184 1.609 6.012L4 29l8.195-1.57a11.94 11.94 0 0 0 3.809.62h.004C22.621 28.05 28 22.667 28 16.046 28 12.84 26.75 9.83 24.48 7.56A11.86 11.86 0 0 0 16.004 3Zm0 2.2a9.76 9.76 0 0 1 6.93 2.86 9.73 9.73 0 0 1 2.867 6.986c0 5.43-4.418 9.848-9.852 9.848a9.86 9.86 0 0 1-3.355-.586l-.48-.176-4.863.93.926-4.742-.2-.488a9.76 9.76 0 0 1-.75-3.782c0-5.43 4.414-9.848 9.848-9.848Zm-5.62 5.3c-.262 0-.688.098-1.047.488-.36.39-1.371 1.34-1.371 3.266 0 1.926 1.402 3.785 1.598 4.047.195.26 2.76 4.215 6.68 5.906.933.403 1.66.643 2.227.824.936.297 1.787.254 2.46.154.75-.112 2.309-.943 2.635-1.855.325-.912.325-1.693.228-1.856-.098-.162-.36-.26-.75-.455-.39-.195-2.309-1.14-2.666-1.27-.357-.13-.618-.195-.879.196-.26.39-1.008 1.269-1.236 1.53-.228.26-.455.293-.845.098-.39-.196-1.645-.607-3.133-1.934-1.158-1.032-1.94-2.307-2.168-2.697-.228-.39-.024-.601.171-.796.176-.175.39-.455.586-.683.195-.228.26-.39.39-.65.13-.26.065-.488-.033-.683-.098-.195-.863-2.13-1.21-2.92-.293-.666-.59-.682-.863-.695-.223-.01-.48-.012-.735-.012Z" />
      </svg>
    </a>
  );
}

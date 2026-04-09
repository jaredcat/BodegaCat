import { useEffect } from "react";
import type { BookingConfig } from "../types/product";

interface BookingEmbedProps {
  config: BookingConfig;
  productName: string;
}

export default function BookingEmbed({
  config,
  productName,
}: Readonly<BookingEmbedProps>) {
  useEffect(() => {
    if (config.provider === "calcom") {
      // Load Cal.com embed script once
      if (!document.getElementById("cal-embed-script")) {
        const script = document.createElement("script");
        script.id = "cal-embed-script";
        script.src = "https://app.cal.com/embed/embed.js";
        script.integrity =
          "sha384-fmD6bOGG93VmhhFvXkjHtOxvQxWhqNQrcngah0Zgfhq8gkcWjxkq3tmuSajNGzi3";
        script.crossOrigin = "anonymous";
        script.async = true;
        document.head.appendChild(script);
      }
    } else if (config.provider === "calendly") {
      // Load Calendly widget script once
      if (!document.getElementById("calendly-embed-script")) {
        const script = document.createElement("script");
        script.id = "calendly-embed-script";
        script.src = "https://assets.calendly.com/assets/external/widget.js";
        script.integrity =
          "sha384-WEEajIp6+kZvWGZBQlBkWmKFk/aPXRqckwSupPdxLgRtChphG3vSWED8ThgLq7xY";
        script.crossOrigin = "anonymous";
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [config.provider]);

  if (config.provider === "calcom") {
    const calLink = config.namespace
      ? `${config.namespace}/${config.eventSlug}`
      : config.eventSlug;
    return (
      <div className="border-t pt-6">
        <button
          type="button"
          data-cal-link={calLink}
          data-cal-config='{"layout":"month_view"}'
          className="btn btn-primary w-full"
        >
          Book {productName}
        </button>
      </div>
    );
  }

  if (config.provider === "calendly") {
    return (
      <div className="border-t pt-6">
        <div
          className="calendly-inline-widget"
          data-url={config.url}
          style={{ minWidth: "320px", height: "700px" }}
        />
      </div>
    );
  }

  // provider === "url"
  return (
    <div className="border-t pt-6">
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary block w-full text-center"
      >
        {config.label ?? `Book ${productName}`}
      </a>
    </div>
  );
}

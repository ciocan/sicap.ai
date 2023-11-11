import * as z from "zod";

const statusEnum = z.enum([
  "operational",
  "degraded_performance",
  "partial_outage",
  "major_outage",
  "under_maintenance",
  "unknown",
]);

const statusSchema = z.object({ status: statusEnum });

const dictionary = {
  operational: {
    label: "Operațional",
    color: "bg-green-500",
  },
  degraded_performance: {
    label: "Performanță degradată",
    color: "bg-yellow-500",
  },
  partial_outage: {
    label: "Întrerupere parțială",
    color: "bg-yellow-500",
  },
  major_outage: {
    label: "Întrerupere majoră",
    color: "bg-red-500",
  },
  unknown: {
    label: "Necunoscut",
    color: "bg-gray-500",
  },
  under_maintenance: {
    label: "În mentenanță",
    color: "bg-gray-500",
  },
} as const;

export async function StatusWidget() {
  const data = await fetch("https://api.openstatus.dev/public/status/sicap", {
    next: { revalidate: 60 },
  }).then((res) => res.json());

  const parsed = statusSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  const key = parsed.data.status;
  const { label, color } = dictionary[key];

  return (
    <a
      className="border-border text-foreground hover:bg-muted hover:text-foreground inline-flex max-w-fit items-center gap-2 rounded-md border px-3 py-1 text-xs"
      href="https://sicap.openstatus.dev"
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <span className="relative flex h-2 w-2">
        {parsed.data.status === "operational" ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75 duration-1000`}
          />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
    </a>
  );
}

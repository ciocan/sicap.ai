"use client";

import { useState } from "react";

const DEFAULT_SHOWN = 8;

export function CompanyActivities({
  activities,
}: {
  activities: { code: string; name?: string }[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) {
    return null;
  }

  const shown = expanded ? activities : activities.slice(0, DEFAULT_SHOWN);

  return (
    <div className="space-y-2">
      <ul className="space-y-1 text-sm">
        {shown.map((activity) => (
          <li key={activity.code}>
            <span className="font-mono text-muted-foreground">{activity.code}</span>
            {activity.name ? ` ${activity.name}` : ""}
          </li>
        ))}
      </ul>
      {activities.length > DEFAULT_SHOWN && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? "Arată mai puține" : `Arată toate activitățile (${activities.length})`}
        </button>
      )}
    </div>
  );
}

"use client";
import { Button } from "@sicap/ui";

export default function Page(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>sicap.ai</h1>
      <Button variant="outline" onClick={() => console.log("clicked!")}>
        button
      </Button>
    </main>
  );
}

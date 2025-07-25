import { SignIn } from "@/components/auth";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";

import { Badge } from "@sicap/ui";

const items = [
  {
    id: 1,
    text: "Cautarea avansata",
  },
  {
    id: 2,
    text: "Exportul in format CSV",
  },
  {
    id: 3,
    text: "Statistici avansate pentru firme si autoritati contractante",
    soon: true,
  },
];

export default async function Page() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <div className="flex flex-col gap-4 max-w-xl place-center place-self-center mt-20">
        <h1 className="text-lg">
          Pentru a accesa toate funcționalitățile disponibile, este necesar să te autentifici în
          contul tău.
        </h1>
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex gap-2 items-center">
              <Check className="h-[1rem] w-[1rem] text-primary" />
              {item.text}
              {item.soon && <Badge>in curand</Badge>}
            </li>
          ))}
        </ul>
        <h2 className="text-gray-500">Inregistrarea este gratuita cu ajutorul contului Google.</h2>
        <SignIn />
      </div>
    </div>
  );
}

import type { FC } from "react";
import { motion } from "motion/react";
import { SparklesIcon, PencilIcon, BookIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@sicap/ui/components/ui/tabs";
import { cn } from "@sicap/ui/lib/utils";
import { Button } from "@sicap/ui/components/ui/button";
import { Separator } from "@sicap/ui/components/ui/separator";

export const ThreadWelcome: FC<{ onSetInput: (input: string) => void }> = ({ onSetInput }) => {
  return (
    <div className="mx-auto max-w-3xl flex w-full flex-grow flex-col pb-10 sm:pb-0">
      <div className="flex w-full flex-grow flex-col items-center justify-center">
        <div className="flex size-full flex-col justify-center px-8 mt-10 sm:-mt-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.5 }}
            className="text-foreground/80 text-3xl font-semibold my-4"
          >
            Salut! 👋
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.6 }}
            className="text-foreground/70 text-xl"
          >
            Cum te pot ajuta în achiziții publice?
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground mt-1 text-base"
          >
            Alege o categorie sau scrie un mesaj. Te pot ajuta să găsești contracte, să analizezi
            licitații, să redactezi documente și să înțelegi pașii legali.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <ThreadWelcomeSuggestions onSetInput={onSetInput} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ThreadWelcomeSuggestions: FC<{ onSetInput: (input: string) => void }> = ({ onSetInput }) => {
  const focusComposer = (action: string) => {
    onSetInput(action);
    // Defer to allow the suggestion to populate the composer first
    setTimeout(() => {
      const input = document.getElementById("composer-input") as
        | HTMLTextAreaElement
        | HTMLInputElement
        | null;
      if (!input) {
        return;
      }

      input.focus();
      const length = input.value.length;
      try {
        input.setSelectionRange(length, length);
      } catch {
        // Some inputs may not support setSelectionRange; ignore
      }
    }, 0);
  };
  const tabs = [
    {
      value: "explore",
      label: "Explorează",
      icon: <SparklesIcon className="size-4" />,
      items: [
        {
          title: "Autorități cu cele mai mari valori",
          label: "în ultimele 12 luni",
          action:
            "Afișează autoritățile contractante cu cele mai mari valori de contracte în ultimele 12 luni și oferă insight-uri principale.",
        },
        {
          title: "Companii cu cele mai multe contracte",
          label: "pe servicii IT",
          action:
            "Găsește companiile cu cele mai multe contracte la categoria CPV servicii IT în România și prezintă un top 10.",
        },
        {
          title: "Tendințe CPV",
          label: "cele mai folosite coduri",
          action:
            "Arată tendințele pentru cele mai folosite coduri CPV în 2024 și explică pe scurt evoluția lor.",
        },
        {
          title: "Ultimele achiziții",
          label: "pentru o autoritate (ex: Cluj-Napoca)",
          action:
            "Listează ultimele achiziții ale Primăriei Cluj-Napoca, cu valoare, CPV și câștigător, într-un tabel sumar.",
        },
      ],
    },
    {
      value: "create",
      label: "Creează",
      icon: <PencilIcon className="size-4" />,
      items: [
        {
          title: "Scrie o cerere de clarificare",
          label: "pentru o licitație în desfășurare",
          action:
            "Scrie o cerere de clarificare pentru o licitație publică în desfășurare. Include referințe la articolele legale relevante și un ton profesionist.",
        },
        {
          title: "Redactează o notă justificativă",
          label: "pentru achiziție directă sub prag",
          action:
            "Redactează o notă justificativă pentru o achiziție directă sub prag, incluzând criterii tehnice, estimarea valorii și motivele alegerii ofertantului.",
        },
        {
          title: "Generează criterii de atribuire",
          label: "cu punctaj și ponderi",
          action:
            "Propune criterii de atribuire pentru servicii IT cu punctaje și ponderi, astfel încât să echilibrăm prețul și calitatea.",
        },
        {
          title: "Compune un răspuns la contestație",
          label: "bazat pe documentația procedurii",
          action:
            "Compune un răspuns la o contestație în achiziții publice, argumentând legal și factologic pe baza documentației procedurii.",
        },
      ],
    },
    {
      value: "learn",
      label: "Învață",
      icon: <BookIcon className="size-4" />,
      items: [
        {
          title: "Procedura simplificată",
          label: "explicată pe scurt",
          action:
            "Explică pe scurt ce este procedura simplificată în achiziții publice și când se aplică, cu referințe la legislație.",
        },
        {
          title: "Achiziție directă vs licitație",
          label: "diferențe principale",
          action:
            "Care sunt diferențele între achiziția directă și licitația deschisă? Prezintă praguri și pași principali.",
        },
        {
          title: "Valoarea estimată",
          label: "metodologie de calcul",
          action:
            "Cum se calculează corect valoarea estimată a contractului și ce factori trebuie considerați?",
        },
        {
          title: "Pașii unei licitații",
          label: "de la inițiere la atribuire",
          action:
            "Descrie pe scurt pașii unei proceduri de licitație deschisă, de la inițiere până la atribuirea contractului.",
        },
      ],
    },
  ] as const;

  return (
    <Tabs defaultValue={tabs[0].value} className="w-full">
      <TabsList className="bg-transparent gap-3 w-full overflow-x-auto overflow-y-hidden flex-nowrap sm:flex-wrap sm:overflow-visible py-8 sm:py-0 pl-18 sm:pl-0">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={cn(
              "cursor-pointer p-5 px-4 text-sm sm:text-base rounded-full text-primary bg-secondary/50",
              "",
            )}
          >
            {t.icon}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t, tabIndex) => (
        <TabsContent key={t.value} value={t.value}>
          <div className="mt-4 grid w-full gap-2">
            {t.items.map((item, index) => (
              <motion.div
                key={`${t.value}-${index}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * (tabIndex * 4 + index) }}
              >
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className={cn(
                      "cursor-pointer dark:hover:bg-accent/60 h-auto w-full items-start justify-start gap-1 px-4 py-3.5 text-left text-sm",
                      "max-w-full whitespace-normal break-words",
                    )}
                    aria-label={item.action}
                    onClick={() => focusComposer(item.action)}
                  >
                    <span className="font-medium">
                      {item.title} <span className="text-muted-foreground">{item.label}</span>
                    </span>
                  </Button>
                  {index < t.items.length - 1 && (
                    <Separator className="h-[1px] border-b-secondary-foreground dark:border-b dark:border-b-secondary-foreground/20" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

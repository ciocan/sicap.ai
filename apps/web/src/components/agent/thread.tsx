import type { FC } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Square,
  HatGlasses,
  SparklesIcon,
  BookIcon,
} from "lucide-react";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ErrorPrimitive,
} from "@assistant-ui/react";
import { motion } from "motion/react";

import {
  TooltipIconButton,
  Separator,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sicap/ui";
import { MarkdownText } from "./markdown-text";
import { ToolFallback } from "./tool-fallback";
import { cn } from "@sicap/ui/lib/utils";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="bg-background flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "0.5rem",
      }}
    >
      <ThreadPrimitive.Viewport className="relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pb-24">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <motion.div className="min-h-6 min-w-6 shrink-0" />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>
      <div className="absolute bottom-0 left-0 right-0 bg-transparent">
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Derulează la jos"
        variant="outline"
        className="dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible text-primary"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)] pb-10 sm:pb-0">
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
              <ThreadWelcomeSuggestions />
            </motion.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  const focusComposer = () => {
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
                  <ThreadPrimitive.Suggestion prompt={item.action} method="replace" asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "cursor-pointer dark:hover:bg-accent/60 h-auto w-full items-start justify-start gap-1 px-4 py-3.5 text-left text-sm",
                        "max-w-full whitespace-normal break-words",
                      )}
                      aria-label={item.action}
                      onClick={focusComposer}
                    >
                      <span className="font-medium">
                        {item.title} <span className="text-muted-foreground">{item.label}</span>
                      </span>
                    </Button>
                  </ThreadPrimitive.Suggestion>
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

const Composer: FC = () => {
  return (
    <div className="bg-transparent backdrop-blur-md relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-0 md:pb-0">
      <ThreadScrollToBottom />
      <ComposerPrimitive.Root className="relative border-8 border-primary-foreground border-b-0 flex w-full flex-col rounded-t-[1.5rem] focus-within:ring-1 focus-within:ring-secondary-foreground/30">
        <ComposerPrimitive.Input
          placeholder="Trimite un mesaj..."
          className="bg-muted/70 backdrop-blur-sm border-border dark:border-muted-foreground/15 focus:outline-primary placeholder:text-muted-foreground max-h-[calc(50dvh)] min-h-16 w-full resize-none rounded-t-2xl border-x border-t px-4 pt-3 pb-3 text-base outline-none"
          rows={1}
          autoFocus
          aria-label="Mesaj input"
          id="composer-input"
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    </div>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="bg-muted/70 border-border dark:border-muted-foreground/15 relative flex items-center justify-between rounded-b-0 border-x border-b p-2">
      <div />
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <Button
            type="submit"
            variant="default"
            className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
            aria-label="Trimite mesaj"
          >
            <ArrowUpIcon className="size-5" />
          </Button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
            aria-label="Stop generează"
          >
            <Square className="size-3.5 fill-white dark:size-4 dark:fill-black" />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 text-sm dark:text-red-200">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-4"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="assistant"
      >
        <div className="ring-border bg-secondary col-start-1 row-start-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
          <HatGlasses className="size-5" />
        </div>

        <div className="text-foreground col-span-2 col-start-2 row-start-1 ml-4 leading-7 break-words">
          <MessagePrimitive.Content
            components={{
              Text: MarkdownText,
              tools: { Fallback: ToolFallback },
            }}
          />
          <MessageError />
        </div>

        <AssistantActionBar />

        <BranchPicker className="col-start-2 row-start-2 mr-2 -ml-2" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground data-floating:bg-background col-start-3 row-start-2 mt-3 ml-3 flex gap-1 data-floating:absolute data-floating:mt-2 data-floating:rounded-md data-floating:border data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-1 px-[var(--thread-padding-x)] py-4 [&:where(>*)]:col-start-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        <UserActionBar />

        <div className="bg-muted text-foreground col-start-2 rounded-3xl px-5 py-2.5 break-words">
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        </div>

        <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="col-start-1 mt-2.5 mr-3 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)]">
      <ComposerPrimitive.Root className="bg-muted ml-auto flex w-full max-w-7/8 flex-col rounded-xl">
        <ComposerPrimitive.Input
          className="text-foreground flex min-h-[60px] w-full resize-none bg-transparent p-4 outline-none"
          autoFocus
        />

        <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="Anulează editare">
              Anulează
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Actualizează mesaj">
              Actualizează
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn("text-muted-foreground inline-flex items-center text-xs", className)}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Anterioare">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Următoare">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

"use client";
import { useRouter, useSearchParams } from "next/navigation";

import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Checkbox,
  useForm,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  zodResolver,
  z,
  Separator,
  ScrollArea,
  ScrollBar,
} from "@sicap/ui";
import { databases, dbIds } from "@/utils";
import { captureAdvanceSearchButtonClick, captureClearFiltersButtonClick } from "@/lib/telemetry";
import { useEffect } from "react";

const defaultValues = {
  db: dbIds,
  q: "",
  dateFrom: "",
  dateTo: "",
  valueFrom: "",
  valueTo: "",
  authority: "",
  cpv: "",
  localityAuthority: "",
  countyAuthority: "",
  supplier: "",
  localitySupplier: "",
  countySupplier: "",
};

const formSchema = z
  .object({
    db: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "Selecteaza cel putin una.",
    }),
    q: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    valueFrom: z.string().optional(),
    valueTo: z.string().optional(),
    authority: z.string().optional(),
    cpv: z.string().optional(),
    localityAuthority: z.string().optional(),
    countyAuthority: z.string().optional(),
    supplier: z.string().optional(),
    localitySupplier: z.string().optional(),
    countySupplier: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
      }
      return true;
    },
    {
      message: "Data de inceput trebuie sa fie mai mica decat data de sfarsit.",
      path: ["dateFrom"],
    },
  )
  .refine(
    (data) => {
      if (data.valueFrom && data.valueTo) {
        return parseInt(data.valueFrom) <= parseInt(data.valueTo);
      }
      return true;
    },
    {
      message: "Valoarea minima trebuie sa fie mai mica decat valoarea maxima.",
      path: ["valueFrom"],
    },
  )
  .refine(
    (data) => {
      if (
        !data.q &&
        !data.dateFrom &&
        !data.dateTo &&
        !data.valueFrom &&
        !data.valueTo &&
        !data.authority &&
        !data.localityAuthority &&
        !data.countyAuthority &&
        !data.cpv &&
        !data.supplier &&
        !data.localitySupplier &&
        !data.countySupplier
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Cel putin un camp trebuie completat.",
      path: ["query"],
    },
  );

interface AdvancedSearchProps {
  query: string;
  setOpen: (open: boolean) => void;
}

export function AdvancedSearch({ query, setOpen }: AdvancedSearchProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = searchParams.get("db");

  const params = {
    ...Object.fromEntries(searchParams.entries()),
    db: db ? db.split(",") : dbIds,
  };

  useEffect(() => {
    form.reset({ ...defaultValues, q: query, ...params });
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      q: query,
      ...params,
    },
  });

  function handleReset() {
    form.reset({ ...defaultValues, q: query });
    captureClearFiltersButtonClick();
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams(
      Array.from(
        Object.entries({
          ...values,
          db: values.db.join(","),
        }).filter(([_, value]) => {
          return value !== "" && value !== undefined && value !== null;
        }),
      ),
    );

    const filters = Object.fromEntries(params.entries());
    captureAdvanceSearchButtonClick({ query: filters.q, filters, mode: "advanced" });
    fetch("/api/search", {
      method: "POST",
      body: JSON.stringify({ query: filters.q, filters, mode: "advanced" }),
    });
    router.push(`/cauta?${params.toString()}`);
    router.refresh();
    setOpen(false);
  }

  return (
    <DialogContent className="sm:max-w-[540px] h-full sm:h-[80%] p-2">
      <Form {...form}>
        <ScrollArea className="p-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
            <DialogHeader>
              <DialogTitle>Cautare avansata</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-8">
              <div className="grid grid-cols-4 items-center gap-4">
                <FormLabel htmlFor="query" className="text-right">
                  Termen de cautare
                </FormLabel>
                <FormField
                  control={form.control}
                  name="q"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormControl>
                        <Input id="query" type="search" {...field} placeholder="cauta orice..." />
                      </FormControl>
                      <FormMessage withToast />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <FormLabel htmlFor="db" className="text-right">
                    Baza de date
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="db"
                    render={() => (
                      <FormItem className="col-span-3">
                        <div className="flex items-center gap-4">
                          {databases.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="db"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex items-center space-x-2 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter((value) => value !== item.id),
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-right text-xs sm:text-sm">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage withToast />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dateFrom" className="text-right">
                  Data publicarii
                </Label>
                <div className="flex flex-1 sm:flex-row flex-col col-span-3 items-center">
                  <FormField
                    control={form.control}
                    name="dateFrom"
                    render={({ field }) => (
                      <FormItem className="col-span-3 w-full">
                        <FormControl>
                          <Input id="dateFrom" type="date" {...field} />
                        </FormControl>
                        <FormMessage withToast />
                      </FormItem>
                    )}
                  />
                  <span className="mx-2">-</span>
                  <FormField
                    control={form.control}
                    name="dateTo"
                    render={({ field }) => (
                      <FormItem className="col-span-3 w-full">
                        <FormControl>
                          <Input id="dateTo" type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valueFrom" className="text-right">
                  Valoare contract
                </Label>
                <div className="flex flex-1 col-span-3 items-center">
                  <FormField
                    control={form.control}
                    name="valueFrom"
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <Input
                          id="valueFrom"
                          min={0}
                          type="number"
                          placeholder="0 RON"
                          {...field}
                        />
                        <FormMessage withToast />
                      </FormItem>
                    )}
                  />
                  <span className="mx-2">-</span>
                  <FormField
                    control={form.control}
                    name="valueTo"
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <Input
                          id="valueFrom"
                          min={0}
                          type="number"
                          placeholder="999,999,999 RON"
                          {...field}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="authority" className="text-right sm:text-sm text-xs">
                  Autoritate contractanta
                </Label>
                <FormField
                  control={form.control}
                  name="authority"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormControl>
                        <Input
                          id="authority"
                          type="search"
                          className="col-span-3"
                          placeholder="Primaria Baicoi"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cpv" className="text-right">
                  Cod CPV
                </Label>
                <FormField
                  control={form.control}
                  name="cpv"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormControl>
                        <Input
                          id="cpv"
                          type="search"
                          className="col-span-3"
                          placeholder="44113620-7 - Asfalt"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="localityAuthority" className="text-right">
                  Localitate
                </Label>
                <FormField
                  control={form.control}
                  name="localityAuthority"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <Input
                        id="localityAuthority"
                        type="search"
                        className="col-span-3"
                        placeholder="Baicoi..."
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="countyAuthority" className="text-right">
                  Judet
                </Label>
                <FormField
                  control={form.control}
                  name="countyAuthority"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <Input
                        id="countyAuthority"
                        type="search"
                        className="col-span-3"
                        placeholder="Prahova..."
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Firma
                </Label>
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <Input
                        id="supplier"
                        type="search"
                        className="col-span-3"
                        placeholder="CUI / Firma SRL"
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="localitySupplier" className="text-right">
                  Localitate
                </Label>
                <FormField
                  control={form.control}
                  name="localitySupplier"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <Input
                        id="localitySupplier"
                        type="search"
                        className="col-span-3"
                        placeholder="Baicoi..."
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="countySupplier" className="text-right">
                  Judet
                </Label>
                <FormField
                  control={form.control}
                  name="countySupplier"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <Input
                        id="countySupplier"
                        type="search"
                        className="col-span-3"
                        placeholder="Prahova..."
                        {...field}
                      />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={handleReset}>
                Sterge filtre
              </Button>
              <Button>Cauta</Button>
            </DialogFooter>
          </form>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Form>
    </DialogContent>
  );
}

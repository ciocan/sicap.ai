import { useState, useEffect } from "react"
import { Text, Stack, Button, Input, Textarea, useToast } from "@chakra-ui/core"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { useSession } from "next-auth/client"

import { GET_ALERTS, SAVE_ALERT } from "@services/queries"

export function AlertList() {
  const [session] = useSession()
  const { data, loading } = useQuery(GET_ALERTS, { skip: !session })
  const [cui, setCui] = useState("")
  const toast = useToast()

  if (!session) return

  useEffect(() => setCui(data?.alerts.join("\n")), [data])

  const [saveAlert, { loading: mutationLoading }] = useMutation(SAVE_ALERT)

  const handleSave = async () => {
    const { data } = await saveAlert({
      variables: {
        cui: cui
          .split("\n")
          .filter((c) => c.trim())
          .map((c) => c.trim())
          .slice(0, 20),
      },
    })

    if (data?.saveAlert) {
      toast({
        title: "Codurile au fost salvate cu success",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
    } else {
      toast({
        title: "Eroare! Incearca din nou.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
    }
  }

  return (
    <Stack spacing={4}>
      <Text fontSize="m" width={["100%", "50%"]}>
        Completeaza CUI ale firmelor ce vrei sa le urmaresti. Vei primi email
        indata ce o licitatie sau achizitie noua este adaugata in baza de date.
        <Text as="em" fontSize="xs" color="red" display="block">
          Doar numarul, fara RO. Maxim 20 firme pot fi urmarite.
        </Text>
      </Text>
      <Input value={session.user.email} isReadOnly width={["100%", "50%"]} />
      <Textarea
        value={cui}
        onChange={(e) => setCui(e.target.value)}
        placeholder={`123456\n77665544\n323456`}
        padding="4"
        width={["100%", "50%"]}
        height="300px"
        disabled={loading}
      />
      <Button
        aria-label="salveaza"
        color="blue"
        width={["100%", "20%"]}
        onClick={handleSave}
        disabled={!cui}
        isLoading={mutationLoading}
      >
        Salveaza
      </Button>
    </Stack>
  )
}

import { Heading } from "@chakra-ui/core"
import { Meta } from "@components"

export function Error404() {
  return (
    <>
      <Meta title="Eroare 404" description="Pagina nu a fost gasita" />
      <Heading fontSize="md" align="center" mt="8">
        Eroare 404 - Pagina nu a fost gasita
      </Heading>
    </>
  )
}

import { initializeApollo } from "@services/apollo"
import { TOTAL } from "@services/queries"
import { useQuery } from "@apollo/react-hooks"
import { Box } from "@chakra-ui/core"

import { Meta } from "@components"
import { MD, number } from "@utils"

const content = ({ licitatii, achizitii }) => `
#### Despre

SICAP.ai este un motor de cautare pentru baza de date a licitatiilor publice si achizitiilor directe.
Datele sunt preluate din portalul guvernamental de licitatii publice [e-licitatie.ro](https://www.e-licitatie.ro/) în baza Licenței pentru Guvernare Deschisa v1.0 

Contractele de licitatii publice si achizitii directe se actualizeaza zilnic iar in prezent sunt indexate ${licitatii} licitatii si ${achizitii} achizitii.

Scopul acestui proiect este de a aduce mai multa transparenta pentru cheltuielile publice si de a putea detecta eventualele suspiciuni de frauda cu ajutorul comunitatii si inteligentei artificiale.

`

export default function Despre() {
  const { data } = useQuery(TOTAL)

  const licitatii = number(data?.total?.licitatii)
  const achizitii = number(data?.total?.achizitii)

  return (
    <>
      <Meta title="Despre SICAP.ai" />
      <Box width={["100%", "100%", "80%"]}>
        {MD(content({ licitatii, achizitii }))}
      </Box>
    </>
  )
}

export const getServerSideProps = async () => {
  const apolloClient = initializeApollo()
  await apolloClient.query({
    query: TOTAL,
  })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

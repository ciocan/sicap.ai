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

Codul este open source pe github la adresa
[arhiva-sicap/sicap.ai](https://github.com/ciocan/sicap.ai)

Pentru analiza avansata unde se pot raspunde la intrebari de genul - Cati lei au fost cheltuiti in Brasov in ultimii 3 ani pe lucrari de constructii de drumuri, sau care este lista cu toate companiile din judetul Ialomita ordonata dupa valoarea contractelor,
exista un proiect separat la adresa [arhiva-sicap/sicap-explorer](https://github.com/arhiva-sicap/sicap-explorer)

Ai sugestii sau recomandari? Foloseste acest [link](https://github.com/ciocan/sicap.ai/issues)
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

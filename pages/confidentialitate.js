import { Meta } from "@components"
import { MD } from "@utils"

const content = `
  #### Termene si conditii

  ##### Confidentialitate

  Anonimitate - informatiile procesate pentru autentificare (email google) nu sunt salvate.
  Pentru a putea avea accees la contul tau, ca identificator unic se foloseste functia hash pe email cu algoritmul [SHA3](https://en.wikipedia.org/wiki/SHA-3) cu cheie de 512 biti.

  Daca folosesti functia de Alerte iti dai acceptul sa primesti pe email notificari atunci cand o companie are indexate contracte noi. Nu vei primi niciun fel de alte notificari.

  Zero tracking - nu sunt instalate scripturi de analytics sau publicitate, nu se folosesc cookies pentru urmarire.

  [APM](https://www.elastic.co/apm) - monitorizarea performantei aplicatiei - sunt stalvate informatii despre browser-ul tau si IP pentru a urmari performanta site-ului. Nu sunt salvate informatii ce pot identifica utlizatorul inregistrat. 

  ##### Transparenta

  Codul este [open-source](https://github.com/arhiva-sicap/sicap.ai)

  Acest site nu este afiliat cu nicio institutie guvernamentala sau comerciala.
`

export default function Confidentialitate() {
  return (
    <>
      <Meta title="Termene si conditii | SICAP.ai" />
      {MD(content)}
    </>
  )
}

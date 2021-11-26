import {
  Heading,
  Box,
  List,
  ListItem,
  ListIcon,
  Text,
  Link,
} from "@chakra-ui/react"
import { MdCheckCircle } from "react-icons/md"

export function AccountBenefits() {
  return (
    <Box mb="2">
      <Heading size="sm" mb="4">
        Beneficii daca esti inregistrat:
      </Heading>
      <List spacing={3} mb="4">
        <ListItem>
          <ListIcon as={MdCheckCircle} color="green.500" />
          Urmarirea unei companii dupa codul fiscal - primesti alerte atunci
          cand sunt indexate contracte noi
        </ListItem>
        <ListItem>
          <ListIcon as={MdCheckCircle} color="green.500" />
          Raportezi contracte ce par suspicioase ca sa ajuti algoritmul de
          inteligenta artificiala sa poata detecta altele similare.
        </ListItem>
        <ListItem>
          <ListIcon as={MdCheckCircle} color="green.500" />
          Lista proprie cu contractele marcate ca &quot;favorite&quot;
        </ListItem>
      </List>
      <Text fontSize="xs">
        Datele dale sunt in siguranta. Citeste&nbsp;
        <Link href="/confidentialitate" isExternal textDecoration="underline">
          politica de confidentialitate
        </Link>
      </Text>
    </Box>
  )
}

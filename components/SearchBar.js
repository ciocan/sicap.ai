import { useState } from "react"
import PropTypes from "prop-types"
import Router, { useRouter } from "next/router"
import { useBreakpoint } from "@chakra-ui/media-query"
import {
  FormControl,
  Input,
  Select,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Box,
} from "@chakra-ui/react"

import { GoSearch } from "react-icons/go"

const dbMap = {
  licitatii: "cauta licitatii publice",
  achizitii: "cauta achizitii directe",
}

const getDbFromUrl = (fragment) => {
  if (fragment === "licitatii") return "licitatii"
  if (fragment === "achizitii") return "achizitii"
  return "licitatii"
}

export function SearchBar({ query, onChangeDb, hide }) {
  const router = useRouter()
  const [, urlFragment] = router.route.split("/")
  const dbFromUrl = getDbFromUrl(urlFragment)
  const defaultValue = query?.replace("+", " ") || ""
  const [value, setValue] = useState(defaultValue)
  const [db, setDb] = useState(dbFromUrl)
  const bp = useBreakpoint()
  const isMobile = bp === "base" || bp === "small"

  const handleChange = (e) => setValue(e.target.value)
  const handleDbChange = (e) => {
    setDb(e.target.value)
    onChangeDb && onChangeDb(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value) {
      const url = value ? `/${db}/${value.replace(" ", "+")}` : "/"
      Router.push(`/${db}/[...param]`, url)
    } else {
      Router.push("/")
    }
  }

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      method="GET"
      maxWidth="42rem"
      minWidth={[0, hide ? "20vw" : "50vw"]}
      color="black"
      display={[hide ? "none" : "block", "block"]}
    >
      <FormControl>
        <InputLeftElement zIndex="10">
          <Select
            onChange={handleDbChange}
            value={db}
            variant="unstyled"
            p="2"
            pl="4"
          >
            <option value="licitatii">
              {isMobile ? "L" : "Licitatii publice"}
            </option>
            <option value="achizitii">
              {isMobile ? "A" : "Achizitii directe"}
            </option>
          </Select>
        </InputLeftElement>
        <Input
          id="search"
          aria-label="cauta"
          name="t"
          placeholder={`${dbMap[db || "licitatii"]}...`}
          borderRadius="15px"
          value={value}
          onChange={handleChange}
          pl={["65px", "160px"]}
          pr="10px"
          borderColor="border.main"
          focusBorderColor="border.selected"
          bg="background.alt"
        />
        <InputRightElement mt="1">
          <IconButton
            aria-label="cauta"
            icon={<GoSearch />}
            color="gray.300"
            variant="ghost"
            colorScheme="tab.100"
            size="sm"
            type="submit"
            ml="2"
          />
        </InputRightElement>
      </FormControl>
    </Box>
  )
}

SearchBar.propTypes = {
  query: PropTypes.string,
  onChangeDb: PropTypes.func,
  hide: PropTypes.bool,
}

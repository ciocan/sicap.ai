import PropTypes from "prop-types"
import { useState, useCallback } from "react"
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Textarea,
  useToast,
} from "@chakra-ui/react"

import { useMutation } from "@apollo/client"
import { ReportSlider } from "@components/pages"
import { SUBMIT_REPORT } from "@services/queries"

export function Report({ contractId, db }) {
  const [confidence, setConfidence] = useState(50)
  const [comment, setComment] = useState("")
  const toast = useToast()

  const [submitReport, { loading }] = useMutation(SUBMIT_REPORT)

  const handleChange = useCallback((c) => setConfidence(c), [confidence])
  const handleInputChange = (e) => {
    setComment(e.target.value)
  }

  const handleSubmit = async () => {
    if (comment.length < 50) {
      toast({
        title: "Textul este prea scurt!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
      return
    }

    const { data } = await submitReport({
      variables: { contractId, confidence, comment, db },
    })

    if (data?.submitReport?.id) {
      toast({
        title: "Raportul a fost inregistrat cu success",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
      setComment("")
      setConfidence(50)
    }
  }

  return (
    <Box
      border="1px"
      borderColor="border.main"
      mb="4"
      p="4"
      bg="white"
      w={["100%", "75%"]}
    >
      <>
        <Heading as="h3" size="md">
          Raporteaza contractul ca suspicios
        </Heading>
        <ReportSlider onChange={handleChange} defaultValue={confidence} />
        <Text my="2">Detaliaza raportul</Text>
        <Textarea
          value={comment}
          onChange={handleInputChange}
          placeholder="De ce crezi ca aceasta tranzactie poate fi frauduloasa? (minim 50 caractere)"
          height="40"
          maxLength="1000"
          minLength="50"
        />
        <Flex justifyContent="flex-end">
          <Button
            aria-label="Trimite raport"
            colorScheme="green"
            mt="2"
            onClick={handleSubmit}
            isLoading={loading}
          >
            Trimite raport
          </Button>
        </Flex>
      </>
    </Box>
  )
}

Report.propTypes = {
  contractId: PropTypes.number.isRequired,
  db: PropTypes.string.isRequired,
}

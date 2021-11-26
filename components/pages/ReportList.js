import Link from "next/link"
import { Text, Stack, Box, Link as ChakraLink } from "@chakra-ui/react"

import { dateTime, CONFIDENCE_LEVELS, colors, confidenceRange } from "@utils"
import { useMe } from "@hooks"

export function ReportList() {
  const { reports, loading } = useMe()

  if (loading) return <Text>se incarca...</Text>
  if (!reports) return null

  return (
    <Stack spacing={4}>
      {reports.map(
        ({ contractId, createdAt, comment, confidence, db }, key) => {
          const confidenceTitle =
            CONFIDENCE_LEVELS[Math.round(confidenceRange(confidence))].title
          const color = colors(confidence)

          return (
            <Box
              key={key}
              bg="white"
              p="2"
              borderWidth="1px"
              borderColor="border.main"
              borderRadius="10px"
              w="100%"
            >
              <Link
                href={`/${db}/contract/[...param]`}
                as={`/${db}/contract/${contractId}`}
                passHref
                prefetch={false}
              >
                <ChakraLink fontSize="xs">{contractId}</ChakraLink>
              </Link>

              <Text fontSize="xs" my="2">
                {dateTime(Number(createdAt))}
              </Text>
              <Text as="b" color={color}>
                {confidenceTitle}
              </Text>
              <Text>{comment}</Text>
            </Box>
          )
        },
      )}
    </Stack>
  )
}

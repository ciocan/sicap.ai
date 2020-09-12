import { useState, useCallback } from "react"
import {
  Box,
  Flex,
  Stack,
  HStack,
  Button,
  Slider,
  Tooltip,
  SliderThumb,
  SliderTrack,
  SliderFilledTrack,
} from "@chakra-ui/core"
import { BiFilter } from "react-icons/bi"

import { encode } from "@utils"

const defaultFilter = {
  years: [2018, 2019],
  threshold: 70,
}

const encodeFilter = (filter) =>
  encode(JSON.stringify({ y: filter.years, t: filter.threshold }))

export const defaultFilterEncoded = encodeFilter(defaultFilter)

export function Filter({ onChange }) {
  const [show, setShow] = useState(false)
  const [filter, setFilter] = useState(defaultFilter)

  const handleYearFilter = useCallback(
    (year) => {
      if (filter.years.length === 1 && filter.years.includes(year)) return

      if (filter.years.includes(year)) {
        setFilter({
          ...filter,
          years: filter.years.filter((y) => y !== year),
        })
      } else {
        setFilter({
          ...filter,
          years: [...filter.years, year],
        })
      }
    },
    [filter.years]
  )

  const handleThresholdFilter = useCallback(
    (value) => setFilter({ ...filter, threshold: value }),
    [filter.threshold]
  )

  const handleFilter = () => {
    onChange(encodeFilter(filter))
  }

  return (
    <HStack mb="4" alignItems="flex-start">
      {show && (
        <Stack width="100%" direction={["column", "row"]}>
          <HStack>
            {[2015, 2016, 2017, 2018, 2019].map((year, key) => (
              <Year
                key={key}
                label={year}
                selected={filter.years.includes(year)}
                onClick={() => handleYearFilter(year)}
              />
            ))}
          </HStack>
          <Tooltip
            hasArrow
            label="Procent din cifra de afaceri in contracte SICAP"
            placement="top"
          >
            <Flex width={["100%", "30%"]}>
              <Slider
                defaultValue={filter.threshold}
                min={50}
                max={100}
                step={5}
                mx={[0, "4"]}
                onChange={handleThresholdFilter}
              >
                <SliderTrack>
                  <SliderFilledTrack bg="blue" />
                </SliderTrack>
                <SliderThumb boxSize={8}>
                  <Box color="blue" fontSize="xs">
                    {filter.threshold}%
                  </Box>
                </SliderThumb>
              </Slider>
            </Flex>
          </Tooltip>
          <Button onClick={handleFilter}>Filtreaza</Button>
        </Stack>
      )}
      <Box
        as="button"
        aria-label="filtreaza"
        ml="auto"
        color="black"
        outline="none"
        onClick={() => setShow(!show)}
      >
        <Box as={BiFilter} boxSize="2em" color={show ? "blue" : "grey"} />
      </Box>
    </HStack>
  )
}

const Year = ({ label, onClick, selected }) => (
  <Button
    onClick={() => onClick(label)}
    color={selected ? "blue" : "grey"}
    borderRadius={["15px", "20px"]}
    fontSize={["xs", "s"]}
    px={[2, 4]}
  >
    {label}
  </Button>
)

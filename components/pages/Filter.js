import { useState, useCallback } from "react"
import {
  Box,
  Text,
  Flex,
  Stack,
  HStack,
  Button,
  Select,
  Slider,
  Tooltip,
  SliderThumb,
  SliderTrack,
  SliderFilledTrack,
} from "@chakra-ui/core"
import { BiFilter } from "react-icons/bi"

import { encode, decode } from "@utils"
import { counties } from "@utils/constants"

const defaultFilter = {
  years: [2018, 2019],
  threshold: 70,
  county: counties[0],
}

const encodeFilter = (filter) =>
  encode(
    JSON.stringify({ y: filter.years, t: filter.threshold, c: filter.county })
  )

export const decodeFilter = (filter) => {
  const f = JSON.parse(decode(filter))
  return {
    years: f.y,
    threshold: f.t,
    county: f.c,
  }
}

export const defaultFilterEncoded = encodeFilter(defaultFilter)

export function Filter({ onChange, data }) {
  const [show, setShow] = useState(false)
  const [filter, setFilter] = useState(
    data ? decodeFilter(data) : defaultFilter
  )

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

  const handleCountyFilter = useCallback(
    (e) => setFilter({ ...filter, county: e.target.value }),
    [filter.county]
  )

  const handleFilter = () => {
    onChange(encodeFilter(filter))
  }

  return (
    <HStack
      p="4"
      mb="4"
      minH={[0, "20"]}
      alignItems={[show ? "flex-start" : "center", "center"]}
      borderRadius="10px"
      bg={show ? "white" : "none"}
    >
      {show && (
        <Stack width="100%" direction={["column", "row"]} spacing={["4", "2"]}>
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
                mx={4}
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
          <Select
            w={["100%", "160px"]}
            value={filter.county}
            onChange={handleCountyFilter}
          >
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </Select>
          <Button onClick={handleFilter}>Filtreaza</Button>
        </Stack>
      )}
      <HStack
        as="button"
        aria-label="filtreaza"
        ml="auto"
        color="black"
        outline="none"
        onClick={() => setShow(!show)}
      >
        <Text display={show ? "none" : "block"}>Arata filtre</Text>
        <Box as={BiFilter} boxSize="2em" color={show ? "blue" : "grey"} />
      </HStack>
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

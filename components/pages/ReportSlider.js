import PropTypes from "prop-types"
import { useState, useCallback } from "react"

import {
  Box,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/core"

import { MdReportProblem } from "react-icons/md"
import { CONFIDENCE_LEVELS, colors, confidenceRange } from "@utils"

export function ReportSlider({ defaultValue = 50, onChange }) {
  const [confidence, setConfidence] = useState(defaultValue)
  const confidenceTitle =
    CONFIDENCE_LEVELS[Math.round(confidenceRange(confidence))].title
  const confidenceText =
    CONFIDENCE_LEVELS[Math.round(confidenceRange(confidence))].description
  const color = colors(confidence)

  const handleChange = useCallback(
    (value) => {
      onChange(value)
      setConfidence(value)
    },
    [confidence],
  )

  return (
    <>
      <Text mt="4">
        Nivelul de incredere:{" "}
        <Text as="b" color={color}>
          {confidenceTitle}
        </Text>
      </Text>
      <Slider defaultValue={defaultValue} onChange={handleChange}>
        <SliderTrack bg="grey">
          <SliderFilledTrack bg={color} />
        </SliderTrack>
        <SliderThumb size="8">
          <Box boxSize="6" p="1" color={color} as={MdReportProblem} />
        </SliderThumb>
      </Slider>
      <Box mb="8">
        <Text fontSize="xs" fontStyle="italic">
          {confidenceText}
        </Text>
      </Box>
    </>
  )
}

ReportSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.number,
}

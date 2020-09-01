import { useState } from "react"

import { Stack, Box, Text, RadioGroup, Radio } from "@chakra-ui/core"
import { dateFormat, moneyRon } from "@utils"
import { FrappeChart } from "@components"

export function Chart({ data }) {
  const [chartType, setChartType] = useState("totalValue")
  const [intervalType, setIntervalType] = useState("months")

  if (!data) return

  const timeSplit = {
    months: {
      interval: "months",
      format: "MMMM yyyy",
    },
    years: {
      interval: "years",
      format: "yyyy",
    },
  }

  const i = timeSplit[intervalType]

  const chartMap = {
    totalCount: {
      title: "Numar contracte",
      data: {
        labels: data[i.interval].map((d) => dateFormat(d.key, i.format)),
        datasets: [
          {
            values: data[i.interval].map((d) => d.count),
            name: "Numar contracte",
          },
        ],
      },
      options: {
        valuesOverPoints: 1,
        tooltipOptions: {
          formatTooltipX: (d) => (d + "").capitalize(),
        },
      },
    },
    totalValue: {
      title: "Valoare contracte",
      data: {
        labels: data[i.interval].map((d) => dateFormat(d.key, i.format)),
        datasets: [
          {
            values: data[i.interval].map((d) => d.value / 1000000),
            name: "Valoare contracte",
          },
        ],
      },
      options: {
        valuesOverPoints: 0,
        tooltipOptions: {
          formatTooltipX: (d) => (d + "").capitalize(),
          formatTooltipY: (d) => moneyRon(d * 1000000),
        },
      },
    },
  }

  return (
    <Box>
      <FrappeChart
        type="line"
        title={chartMap[chartType].title}
        colors={["#0062FF"]}
        axisOptions={{ xAxisMode: "tick", yAxisMode: "tick", xIsSeries: 1 }}
        height={200}
        data={chartMap[chartType].data}
        {...chartMap[chartType].options}
      />
      <Stack
        fontSize="xs"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems="center">
          <Text>Tip grafic</Text>
          <RadioGroup
            defaultValue={chartType}
            value={chartType}
            onChange={(val) => setChartType(val)}
            colorScheme="checkbox"
          >
            <Stack direction="row">
              <Radio size="sm" value="totalValue">
                Valoare
              </Radio>
              <Radio size="sm" value="totalCount">
                Numar
              </Radio>
            </Stack>
          </RadioGroup>
        </Stack>
        <Stack direction="row" alignItems="center" ml="auto">
          <Text>Interval</Text>
          <RadioGroup
            defaultValue={intervalType}
            value={intervalType}
            onChange={(val) => setIntervalType(val)}
            colorScheme="checkbox"
          >
            <Stack direction="row">
              <Radio size="sm" value="months">
                Luni
              </Radio>
              <Radio size="sm" value="years">
                Ani
              </Radio>
            </Stack>
          </RadioGroup>
        </Stack>
      </Stack>
    </Box>
  )
}

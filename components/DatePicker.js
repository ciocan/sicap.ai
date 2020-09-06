import { useState, useEffect } from "react"
import ReactDatePicker from "react-datepicker"
import { Input, InputGroup, InputLeftElement, Stack } from "@chakra-ui/core"
import { CalendarIcon } from "@chakra-ui/icons"
import { getUnixTime, fromUnixTime } from "date-fns"

const CustomInput = ({ value, onClick }) => (
  <InputGroup>
    <InputLeftElement zIndex="2" children={<CalendarIcon />} />
    <Input onClick={onClick} onChange={() => {}} value={value} />
  </InputGroup>
)

export function DatePicker({ onChange, start, end }) {
  const [startDate, setStartDate] = useState(
    start ? fromUnixTime(start) : new Date("2007/01/01")
  )
  const [endDate, setEndDate] = useState(end ? fromUnixTime(end) : new Date())

  useEffect(() => {
    onChange(getUnixTime(startDate), getUnixTime(endDate))
  }, [startDate, endDate])

  return (
    <Stack direction={["column", "row"]} justifyContent="flex-end">
      <ReactDatePicker
        customInput={<CustomInput />}
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        dateFormat="dd/MM/yyyy"
        showYearDropdown
        locale="ro"
      />
      <ReactDatePicker
        customInput={<CustomInput />}
        selected={endDate}
        onChange={(date) => setEndDate(date)}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        dateFormat="dd/MM/yyyy"
        showYearDropdown
        locale="ro"
      />
    </Stack>
  )
}

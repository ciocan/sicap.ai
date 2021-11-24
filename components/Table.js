import styled from "styled-components"
import { useTable, usePagination } from "react-table"
import { Text, Select, Input, Box, Stack, IconButton } from "@chakra-ui/core"
import {
  BiArrowToLeft,
  BiArrowToRight,
  BiLeftArrowAlt,
  BiRightArrowAlt,
} from "react-icons/bi"

const Container = styled.div`
  max-width: 100%;

  table {
    width: 100%;
    border-spacing: 0;

    thead {
      :first-child {
        th {
          border-right: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      &.collapse {
        width: 0.0000000001%;
      }

      :last-child {
        border-right: 0;
        text-align: right;
      }

      :nth-child(1) {
        text-align: right;
      }

      :nth-child(2) {
        text-align: left;
      }

      :nth-child(3) {
        text-align: right;
      }
    }
  }
`

export function Table({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    usePagination,
  )

  return (
    <Container>
      <Box maxWidth="100%" overflowX="scroll" overflowY="hidden">
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup, k) => (
              <tr key={k} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, k) => (
                  <th
                    key={k}
                    {...column.getHeaderProps({
                      className: column.collapse ? "collapse" : "",
                    })}
                  >
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, k) => {
              prepareRow(row)
              return (
                <tr key={k} {...row.getRowProps()}>
                  {row.cells.map((cell, k) => {
                    return (
                      <td
                        key={k}
                        {...cell.getCellProps({
                          className: cell.column.collapse ? "collapse" : "",
                        })}
                      >
                        {cell.render("Cell")}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Box>
      <Stack
        mt="4"
        direction={["column", "row"]}
        justifyContent="center"
        spacing="2"
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing="2"
          justifyContent="center"
        >
          <IconButton
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            aria-label="Prima pagina"
            icon={<BiArrowToLeft />}
          />
          <IconButton
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            aria-label="Prima precedenta"
            icon={<BiLeftArrowAlt />}
          />
          <IconButton
            onClick={() => nextPage()}
            disabled={!canNextPage}
            aria-label="Prima urmatoare"
            icon={<BiRightArrowAlt />}
          />
          <IconButton
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            aria-label="Ultima pagina"
            icon={<BiArrowToRight />}
          />
        </Stack>
        <Stack direction={["column", "row"]} alignItems="center">
          <Text>
            Pagina {pageIndex + 1} din {pageOptions.length}{" "}
          </Text>
          <Box>
            Mergi la pagina:{" "}
            <Input
              w="16"
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                gotoPage(page)
              }}
            />
          </Box>
          <Select
            w="32"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
            }}
          >
            {[10, 20, 30, 40, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Arata {pageSize}
              </option>
            ))}
          </Select>
        </Stack>
      </Stack>
    </Container>
  )
}

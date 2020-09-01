import React from "react"
import { Chart } from "frappe-charts/dist/frappe-charts.min.cjs"

export function FrappeChart(props) {
  const ref = React.useRef(null)
  const chart = React.useRef(null)
  const { onDataSelect } = props

  React.useEffect(() => {
    chart.current = new Chart(ref.current, {
      isNavigable: onDataSelect !== undefined,
      ...props,
    })
    if (onDataSelect) {
      chart.current.parent.addEventListener("data-select", (e) => {
        e.preventDefault()
        onDataSelect(e)
      })
    }
  }, [props])

  React.useEffect(() => {
    chart.current.update(props.data)
  }, [props.data])

  return <div ref={ref} />
}

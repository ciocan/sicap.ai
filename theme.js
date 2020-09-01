import theme from "@chakra-ui/theme"

const fonts = { ...theme.fonts, mono: `'Menlo', monospace` }
const colors = {
  ...theme.colors,
  red: "red",
  blue: "#0062FF",
  tab: {
    100: "#0062FF",
  },
  white: "#FFF",
  grey: "#bdbdbd",
  border: {
    main: "#e2e2ea",
    alt: "#f1f1f5",
    selected: "#c8dcfc",
  },
  background: {
    main: "#fafafb",
    selected: "#f3f5fb",
    selectedAlt: "#ecf1fb",
  },
  checkbox: {
    500: "#0062FF",
  },
}

const breakpoints = ["30em", "48em", "62em", "80em"]

breakpoints.sm = breakpoints[0]
breakpoints.md = breakpoints[1]
breakpoints.lg = breakpoints[2]
breakpoints.xl = breakpoints[3]

const appTheme = {
  ...theme,
  fonts,
  breakpoints,
  colors,
}

export default appTheme

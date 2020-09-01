const withPWA = require("next-pwa")
const runtimeCaching = require("./cache")

const settings = {
  pwa: {
    dest: "public",
    runtimeCaching,
  },
}

module.exports =
  process.env.NODE_ENV === "development" ? settings : withPWA(settings)

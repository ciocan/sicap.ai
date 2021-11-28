import { useEffect } from "react"

import { CRISP_WEBSITE_ID } from "@utils/config"

const CrispChat = () => {
  useEffect(() => {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID
    ;(() => {
      const d = document
      const s = d.createElement("script")

      s.src = "https://client.crisp.chat/l.js"
      s.async = true
      d.getElementsByTagName("head")[0].appendChild(s)
    })()
  }, [])

  return null
}

export default CrispChat

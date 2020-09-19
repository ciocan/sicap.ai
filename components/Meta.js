// TODO: remove quotes from meta descriptions

import PropTypes from "prop-types"
import Head from "next/head"
import { useRouter } from "next/router"

import { SITE_URL } from "@utils/config"

const defaultDescription =
  "Detector de achizitii frauduloase cu ajutorul inteligentei artificiale"

export function Meta({ title, description, url }) {
  const router = useRouter()
  const pageUrl = `${SITE_URL}${router.asPath}`

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta property="og:title" content={title} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      <meta property="og:site_name" content="SICAP.ai" />
      <meta property="og:url" content={url || pageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/icon-512x512.png" />
    </Head>
  )
}

Meta.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  url: PropTypes.string,
}

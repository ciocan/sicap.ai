// TODO: remove quotes from meta descriptions

import PropTypes from "prop-types"
import Head from "next/head"

const defaultDescription =
  "Detector de achizitii frauduloase cu ajutorul inteligentei artificiale"

export function Meta({ title, description, url }) {
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
      <meta property="og:url" content={url || "https://sicap.ai"} />
      <meta property="og:type" content="website" />
    </Head>
  )
}

Meta.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  url: PropTypes.string,
}

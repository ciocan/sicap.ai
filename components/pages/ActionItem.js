import PropTypes from "prop-types"
import { Box, Tooltip } from "@chakra-ui/react"
import { useContext } from "react"
import { useSession } from "next-auth/client"

import { ModalContext } from "@utils"

export function ActionItem({ icon, label, onClick, color = "" }) {
  const openLoginModal = useContext(ModalContext)
  const [session] = useSession()

  const handleClick = () => {
    if (session) {
      onClick()
    } else {
      openLoginModal()
    }
  }

  return (
    <Tooltip hasArrow label={label} placement="top">
      <Box
        as="button"
        aria-label={label}
        _hover={{ textDecoration: "underline" }}
        justifySelf="end"
        color="black"
        outline="none"
        onClick={handleClick}
      >
        <Box as={icon} boxSize="1.5em" color={color} />
      </Box>
    </Tooltip>
  )
}

ActionItem.propTypes = {
  icon: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
}

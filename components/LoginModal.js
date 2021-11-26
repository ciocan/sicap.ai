import PropTypes from "prop-types"

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react"

import { LoginButton } from "@components"
import { AccountBenefits } from "@components/pages"

export function LoginModal({ isOpen, onClose }) {
  return (
    <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Autentificare</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AccountBenefits />
          </ModalBody>
          <ModalFooter>
            <LoginButton />
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}

LoginModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

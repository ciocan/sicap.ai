import PropTypes from "prop-types"

import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  Button,
} from "@chakra-ui/core"

export function Alert({ isOpen, onClose, onConfirm }) {
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Sterge de la favorite
          </AlertDialogHeader>
          <AlertDialogBody>Esti sigur?</AlertDialogBody>
          <AlertDialogFooter>
            <Button aria-label="Renunta" onClick={onClose}>
              Renunta
            </Button>
            <Button
              aria-label="Sterge"
              color="red"
              onClick={() => {
                onClose()
                onConfirm()
              }}
              ml={3}
            >
              Sterge
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

Alert.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

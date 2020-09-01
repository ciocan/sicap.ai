import { Button, Box } from "@chakra-ui/core"
import { FcGoogle } from "react-icons/fc"
import { signIn } from "next-auth/client"

import { SITE_URL } from "@utils/config"

export function LoginButton() {
  return (
    <Button
      as="a"
      aria-label="Autentificare"
      leftIcon={<Box as={FcGoogle} mr="2" width="18px" height="18px" />}
      bg="white"
      color="#757575"
      border="1px"
      borderColor="#f6f6f6"
      borderBottom="2px"
      borderBottomColor="#cdcdcd"
      onClick={() => signIn("google", { callbackUrl: SITE_URL })}
      css={{ cursor: "pointer" }}
    >
      Autentificare cu Google
    </Button>
  )
}

import { useQuery } from "@apollo/client"
import { useSession } from "next-auth/client"

import { ME } from "@services/queries"

export function useMe() {
  const [session] = useSession()
  const { data, loading } = useQuery(ME, { skip: !session })
  const bookmarks = data?.me?.bookmarks || []
  const reports = data?.me?.reports

  return { bookmarks, reports, loading }
}

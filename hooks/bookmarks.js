import { useQuery, useMutation } from "@apollo/client"
import { useSession } from "next-auth/client"

import { BOOKMARKS, TOGGLE_BOOKMARK } from "@services/queries"

export function useBookmarks(db) {
  const [session] = useSession()
  const { data } = useQuery(BOOKMARKS, { skip: !session })

  const bookmarks =
    data?.bookmarks.filter((b) => b.db === db).map((b) => b.contractId) || []

  const [toggleBookmark, { loading }] = useMutation(TOGGLE_BOOKMARK, {
    update(cache, { data: { toggleBookmark } }) {
      cache.writeQuery({
        query: BOOKMARKS,
        data: { bookmarks: toggleBookmark },
      })
    },
  })

  const handleBookmarkToggle = (id) => {
    if (loading) return

    const contractId = Number(id)

    const isBookmarked = bookmarks?.find((b) => b.contractId === contractId)
    // TODO: fix optimistic bookmarks
    const optimisticBookmarks = isBookmarked
      ? [
          ...bookmarks?.filter(
            (b) => b.contractId !== contractId && b.db === db,
          ),
        ]
      : [...bookmarks, { contractId, db, __typename: "Bookmark" }]

    const optimisticResponse = bookmarks
      ? {
          __typename: "Mutation",
          toggleBookmark: optimisticBookmarks,
        }
      : null

    toggleBookmark({
      variables: { contractId, db },
      optimisticResponse,
    })
  }

  return { bookmarks, handleBookmarkToggle }
}

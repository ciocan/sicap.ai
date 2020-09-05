import { useRouter } from "next/router"

export function Stats() {
  const router = useRouter()
  const [db, stat = "firme"] = router.query?.param || ["licitatii"]

  return <div>{`${db}/${stat}`}</div>
}

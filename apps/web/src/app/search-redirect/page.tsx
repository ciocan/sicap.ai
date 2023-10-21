import { redirect } from "next/navigation";

export default async function Page(props) {
  const { searchParams } = props;
  const queryString = new URLSearchParams(searchParams).toString();
  redirect(`/cauta?${queryString}`);
}

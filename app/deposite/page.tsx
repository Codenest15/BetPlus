import { redirect } from "next/navigation";

/** Common misspelling — send users to the wallet deposit tab. */
export default function DepositePage() {
  redirect("/wallet");
}

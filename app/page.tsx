import { redirect } from "next/navigation";
import { sessionCookies } from "@/lib/server-api";
export default async function Home() { redirect((await sessionCookies.hasAccess()) ? "/dashboard" : "/login"); }

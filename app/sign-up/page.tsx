import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuthForm } from "@/components/auth-form"
export default async function SignUpPage(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)redirect("/account");return <AuthForm mode="sign-up"/>}

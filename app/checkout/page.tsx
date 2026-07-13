import type { Metadata } from "next"
import { StoreShell } from "@/components/store-shell"
import { CheckoutForm } from "@/components/checkout-form"
export const metadata: Metadata = { title: "Checkout" }
export default function CheckoutPage() { return <StoreShell><CheckoutForm/></StoreShell> }

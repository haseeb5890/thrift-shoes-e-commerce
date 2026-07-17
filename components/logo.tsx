import Image from "next/image"
import Link from "next/link"

const VARIANTS = {
  primary: { src: "/logocheck.png", width: 1546, height: 1011 },
  secondary: { src: "/logo.secondary.png", width: 669, height: 373 },
}

export function Logo({ href = "/", size = "h-10", wrapperClassName = "", variant = "primary" }: { href?: string; size?: string; wrapperClassName?: string; variant?: keyof typeof VARIANTS }) {
  const { src, width, height } = VARIANTS[variant]
  return <Link href={href} className={`flex items-center ${wrapperClassName}`}><Image src={src} alt="Prime Soles" width={width} height={height} priority className={`w-auto object-contain ${size}`}/></Link>
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, MessageCircle } from "lucide-react"

interface CTASectionProps {
  title?: string
  description?: string
}

export function CTASection({ 
  title = "Ready for Your Beauty Transformation?",
  description = "Book your appointment today and let our expert stylists help you look and feel your best."
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-6 py-12 text-primary-foreground md:px-12">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-2xl font-bold md:text-3xl text-balance">
          {title}
        </h2>
        <p className="mt-4 text-primary-foreground/80">
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <Link href="/booking" className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Book Appointment
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <a href="tel:+15551234567" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Now
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link href="/contact" className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact Us
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background via-background to-orange-950/5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg shadow-orange-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Vielen Dank für die Registrierung!</CardTitle>
              <CardDescription>Bestätige deine E-Mail-Adresse</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Du hast dich erfolgreich registriert. Bitte überprüfe dein E-Mail-Postfach und bestätige deine
                E-Mail-Adresse, bevor du dich anmeldest.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Zur Anmeldung</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

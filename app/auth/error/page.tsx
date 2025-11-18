import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

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
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Entschuldigung, etwas ist schiefgelaufen</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Fehlercode: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Ein unbekannter Fehler ist aufgetreten.</p>
              )}
              <Button asChild className="w-full">
                <Link href="/auth/login">Zurück zur Anmeldung</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

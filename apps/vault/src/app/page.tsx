import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            📚 Nimble RPG Vault
          </h1>
          <p className="text-lg text-muted-foreground">
            Your comprehensive digital repository for the Nimble tabletop role-playing game system
          </p>
        </header>

        <main className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Vault</CardTitle>
              <CardDescription>
                Your gateway to the Nimble RPG universe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This is the redesigned Nimble RPG Vault with shadcn/ui styling to match the portal design.
                Explore rules, character options, spells, and lore for your tabletop adventures.
              </p>
              <div className="flex gap-4">
                <Button>Explore Rules</Button>
                <Button variant="outline">Character Options</Button>
                <Button variant="secondary">Lore & Setting</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Character Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build unique characters with our comprehensive ancestry, background, and class system.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Magic System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discover the tier-based magic system with schools of power and spell progression.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game Mastery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tools and guidance for running engaging Nimble RPG campaigns.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Search, Copy, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">SecureVault</h1>
          </div>
          <Button onClick={() => window.location.href = '/api/login'} data-testid="button-login">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Secure Secrets Manager
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Store and manage all your API secrets in a structured, searchable, and secure way. 
              Built with AES-256 encryption and modern security practices.
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="mb-8"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Everything you need to manage secrets securely
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional-grade security features for your API credentials
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Lock className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>AES-256 Encryption</CardTitle>
                <CardDescription>
                  All secrets are encrypted at rest using industry-standard AES-256 encryption
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Search className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription>
                  Find any secret instantly with powerful search across projects and platforms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Copy className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>One-Click Copy</CardTitle>
                <CardDescription>
                  Copy secret values to clipboard with a single click for seamless workflow
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Project Organization</CardTitle>
                <CardDescription>
                  Organize secrets by projects with platform categorization (AWS, Google, Stripe, etc.)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Secure Access</CardTitle>
                <CardDescription>
                  JWT-based authentication with automatic session management and security headers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Multiple Secret Types</CardTitle>
                <CardDescription>
                  Support for API Keys, Client IDs, Client Secrets, Access Tokens, and custom types
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Ready to secure your secrets?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of developers who trust SecureVault to manage their API credentials safely.
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-start-now"
            >
              Start Now - It's Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 SecureVault. Built with security in mind.</p>
        </div>
      </footer>
    </div>
  );
}

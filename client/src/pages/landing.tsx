import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Vote, Users, BarChart3, Lock, CheckCircle } from "lucide-react";

export default function Landing() {
  useEffect(() => {
    // Set page title
    document.title = "SecureVote - Secure Electronic Voting Platform";
  }, []);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-vote-surface">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-vote-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Vote className="text-vote-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-vote-primary">SecureVote</span>
              </div>
              <span className="hidden sm:block text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4 text-vote-secondary mr-1 inline" />
                Certified Secure Platform
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleLogin}
                className="bg-vote-primary hover:bg-blue-700 text-white px-6 py-2 transition-colors"
                data-testid="button-login"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-vote-primary to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-hero-title">
              Secure Electronic Voting
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100" data-testid="text-hero-subtitle">
              Democratic participation with military-grade security and complete transparency
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-white text-vote-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-vote-primary px-8 py-3 text-lg font-semibold"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-features-title">
            Why Choose SecureVote?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-features-subtitle">
            Built with advanced cybersecurity, blockchain verification, and complete audit trails
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Security Feature */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-security">
            <CardHeader>
              <div className="w-12 h-12 bg-vote-primary rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Military-Grade Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                End-to-end encryption, multi-factor authentication, and zero-knowledge proofs ensure your vote remains private and secure.
              </p>
            </CardContent>
          </Card>

          {/* Transparency Feature */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-transparency">
            <CardHeader>
              <div className="w-12 h-12 bg-vote-secondary rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Complete Transparency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time results, immutable audit trails, and public verification ensure complete transparency in the voting process.
              </p>
            </CardContent>
          </Card>

          {/* Accessibility Feature */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-accessibility">
            <CardHeader>
              <div className="w-12 h-12 bg-vote-warning rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Universal Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Mobile-friendly interface, accessibility compliance, and multi-language support ensure everyone can participate.
              </p>
            </CardContent>
          </Card>

          {/* Verification Feature */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-verification">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Verifiable Voting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Each vote generates a unique verification code, allowing voters to confirm their ballot was counted correctly.
              </p>
            </CardContent>
          </Card>

          {/* Privacy Feature */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-privacy">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Anonymous Voting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced anonymization techniques ensure vote secrecy while maintaining the ability to verify election integrity.
              </p>
            </CardContent>
          </Card>

          {/* Compliance Feature */}
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-compliance">
            <CardHeader>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Regulatory Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Meets EAC guidelines, ISO 27001 standards, and WCAG accessibility requirements for official elections.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-vote-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4" data-testid="text-cta-title">
              Ready to Secure Your Elections?
            </h2>
            <p className="text-xl text-blue-100 mb-8" data-testid="text-cta-subtitle">
              Join thousands of organizations worldwide who trust SecureVote
            </p>
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-white text-vote-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              data-testid="button-start-now"
            >
              Start Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Vote className="w-6 h-6 text-vote-primary mr-2" />
              <span className="text-lg font-bold">SecureVote</span>
            </div>
            <p className="text-gray-400">
              © 2024 SecureVote Platform. Securing democracy through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

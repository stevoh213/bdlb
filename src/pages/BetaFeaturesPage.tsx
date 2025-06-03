import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BetaFeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  const betaFeatures = [
    {
      title: "Voice Logs",
      description: "Record and transcribe your climbing sessions using voice commands. Perfect for hands-free logging while climbing.",
      path: "/voice-logs",
      status: "active"
    },
    // Add more beta features here as they become available
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Beta Features</h1>
        <p className="text-muted-foreground mb-8">
          Try out our latest experimental features. These features are still in development and may change.
        </p>

        <div className="grid gap-6">
          {betaFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                  <Button 
                    onClick={() => navigate(feature.path)}
                    className="flex items-center gap-2"
                  >
                    Try it out
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    feature.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-muted-foreground">
                    {feature.status === 'active' ? 'Active' : 'In Development'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BetaFeaturesPage; 
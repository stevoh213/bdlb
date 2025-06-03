
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BorderBeam } from '@/components/ui/border-beam';
import { useAuthForm } from '@/hooks/useAuthForm';
import { Mountain, X, MapPin } from 'lucide-react';
import { climbingLocations, getLocationByIndex, type ClimbingLocation } from '@/data/climbingLocations';

const VisualLoginForm = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [locationOffset, setLocationOffset] = useState(0);
  const {
    email,
    password,
    isLoading,
    handleEmailChange,
    handlePasswordChange,
    handleSignIn,
    handleSignUp,
  } = useAuthForm();

  // Get a location based on the current day + manual offset
  const currentLocation: ClimbingLocation = useMemo(() => {
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return getLocationByIndex(daysSinceEpoch + locationOffset);
  }, [locationOffset])

  const handleLocationClick = () => {
    setLocationOffset(prev => prev + 1);
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowLoginForm(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Extended Coverage */}
      <div 
        className="absolute bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: `url('${currentLocation.imagePath}')`,
          top: '-50vh',
          left: '-10vw',
          right: '-10vw',
          bottom: '-50vh',
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white px-4">
        {/* Location Info */}
        <button
          onClick={handleLocationClick}
          className="absolute top-8 left-8 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-black/50 transition-colors cursor-pointer"
        >
          <MapPin className="h-4 w-4" />
          <div className="text-left">
            <p className="text-sm font-semibold">{currentLocation.name}</p>
            <p className="text-xs text-white/80">{currentLocation.location}</p>
          </div>
        </button>

        {/* Branding */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mountain className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-8xl font-bold tracking-wide mb-2">BDLB</h1>
          <p className="text-xl text-white/90">Track your climbing progress</p>
        </div>
        
        {/* Login Button */}
        <Button 
          onClick={() => setShowLoginForm(true)}
          className="bg-white text-black hover:bg-white/90 px-12 py-4 text-lg font-semibold rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        >
          Log in
        </Button>
      </div>

      {/* Full Modal Overlay */}
      {showLoginForm && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 transition-all duration-300"
          onClick={handleOverlayClick}
        >
          <div className="relative w-full max-w-md">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl animate-scale-in">
              <BorderBeam 
                size={300} 
                duration={12} 
                colorFrom="#ff6b35" 
                colorTo="#f7931e" 
                className="rounded-lg"
              />
              
              {/* Close Button */}
              <div className="absolute -top-2 -right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLoginForm(false)}
                  className="h-8 w-8 bg-white shadow-md hover:bg-gray-100 text-gray-700 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mountain className="h-8 w-8 text-amber-600" />
                  <CardTitle className="text-2xl font-bold text-stone-800">BDLB</CardTitle>
                </div>
                <p className="text-stone-600">Welcome back</p>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          placeholder="Enter your email"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Enter your password"
                          required
                          className="h-12"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          placeholder="Enter your email"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Create a password"
                          required
                          minLength={6}
                          className="h-12"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating account...' : 'Sign Up'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualLoginForm;

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Shield, Users, BarChart, Calendar, MessageSquare, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroSlider } from '@/components/hero-slider';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Index() {
  const navigate = useNavigate();

  const handlePortalSelect = (portal: string) => {
    navigate(`/auth?portal=${portal}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Binned Ventures</h1>
            <p className="text-sm text-muted-foreground">P.O. Box 708, Odorkor • Accra, Ghana</p>
          </div>
        </motion.div>
        <ThemeToggle />
      </header>

      <section className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Employee Management System
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Streamline your workforce management with our comprehensive platform designed for 
            Binned Ventures' 100+ employees.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <HeroSlider onPortalSelect={handlePortalSelect} />
        </motion.div>
      </section>
    </div>
  );
}
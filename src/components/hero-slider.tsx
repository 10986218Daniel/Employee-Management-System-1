import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Calendar, Award, Shield, BarChart, MessageSquare } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Employee Portal",
    subtitle: "Manage Your Work Life",
    description: "Access your profile, submit requests, track attendance, and communicate with your team.",
    features: ["Profile Management", "Leave Requests", "Attendance Tracking", "Team Communication"],
    icon: Users,
    gradient: "from-blue-600 to-purple-600"
  },
  {
    id: 2,
    title: "HR Portal", 
    subtitle: "Human Resource Management",
    description: "Comprehensive HR tools for employee management, reports, and organizational oversight.",
    features: ["Employee Records", "Performance Reviews", "Analytics Dashboard", "Policy Management"],
    icon: BarChart,
    gradient: "from-green-600 to-teal-600"
  },
  {
    id: 3,
    title: "Admin Portal",
    subtitle: "System Administration",
    description: "Complete control over the system with advanced management and security features.",
    features: ["User Management", "System Settings", "Security Controls", "Advanced Analytics"],
    icon: Shield,
    gradient: "from-orange-600 to-red-600"
  }
];

interface HeroSliderProps {
  onPortalSelect: (portal: string) => void;
}

export function HeroSlider({ onPortalSelect }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const getPortalKey = (title: string) => {
    return title.toLowerCase().replace(' portal', '');
  };

  return (
    <div className="relative h-[600px] overflow-hidden rounded-3xl shadow-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-between px-12`}
        >
          <div className="flex-1 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <div className="flex items-center gap-3 mb-4">
                {React.createElement(slides[currentSlide].icon, { className: "h-12 w-12" })}
                <div>
                  <h1 className="text-5xl font-bold mb-2">{slides[currentSlide].title}</h1>
                  <p className="text-xl opacity-90">{slides[currentSlide].subtitle}</p>
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-6 opacity-90 max-w-md"
            >
              {slides[currentSlide].description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold mb-3">Key Features:</h3>
              <ul className="space-y-2">
                {slides[currentSlide].features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              onClick={() => onPortalSelect(getPortalKey(slides[currentSlide].title))}
              className="bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg"
            >
              Access {slides[currentSlide].title}
            </motion.button>
          </div>

          <div className="flex-1 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-96 h-96 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-float"
            >
              {React.createElement(slides[currentSlide].icon, { className: "h-48 w-48 text-white/80" })}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
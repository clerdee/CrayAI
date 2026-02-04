import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  IconButton,
  Stack,
  Chip
} from '@mui/material';

// --- IMPORTS ---
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// --- ICONS ---
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';

// NEW SLIDESHOW ICONS
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'; // For Dashboard/Monitor
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'; // For Visual/Camera
import WavesIcon from '@mui/icons-material/Waves'; // For Water

// --- FONT STYLES & ANIMATIONS ---
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap');
      
      body, h1, h2, h3, h4, h5, h6, p, span, div, button {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
      }

      /* Text Gradient Effect */
      .gradient-text {
        background: linear-gradient(90deg, #00E5FF 0%, #00ffaa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-block;
      }

      /* Animations */
      @keyframes float { 
        0% { transform: translateY(0px); } 
        50% { transform: translateY(-20px); } 
        100% { transform: translateY(0px); } 
      }
      @keyframes scan { 
        0% { transform: translateY(0); } 
        100% { transform: translateY(200px); } 
      }
    `}
  </style>
);

// --- HERO SLIDESHOW COMPONENT ---
const HeroSlideshow = () => {
  const slides = [
    {
      type: 'video',
      align: 'left', // Layout: Left
      url: "/media/crayfish.mp4", 
      title: "Monitor. Analyze. Farm.",
      subtitle: "The all-in-one intelligence platform for the modern crayfish farmer.",
      icon: <SpaceDashboardIcon sx={{ fontSize: { xs: 50, md: 70 }, color: '#00E5FF' }} />
    },
    {
      type: 'image',
      align: 'center', // Layout: Center
      url: "/media/close-up-crayfish.jpg",
      title: "Precision Visual Analysis",
      subtitle: "Identify gender, species, and health status instantly with just your camera.",
      icon: <CenterFocusStrongIcon sx={{ fontSize: { xs: 50, md: 70 }, color: '#00ffaa' }} />
    },
    {
      type: 'image',
      align: 'right', // Layout: Right
      url: "/media/aquarium.jpg", 
      title: "See What Lies Beneath",
      subtitle: "Track water turbidity and algae blooms in real-time.",
      icon: <WavesIcon sx={{ fontSize: { xs: 50, md: 70 }, color: '#00E5FF' }} />
    }
  ];

  const [current, setCurrent] = useState(0);

  // Auto-play logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 8000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrent(current === slides.length - 1 ? 0 : current + 1);
  const prevSlide = () => setCurrent(current === 0 ? slides.length - 1 : current - 1);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: { xs: '500px', md: '650px' }, overflow: 'hidden', bgcolor: '#001E3C' }}>
      
      {/* SLIDES RENDERER */}
      {slides.map((slide, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute', inset: 0,
            opacity: index === current ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: index === current ? 2 : 1,
            overflow: 'hidden' 
          }}
        >
          {/* LAYER 1: MEDIA */}
          {slide.type === 'video' ? (
             <video
               autoPlay loop muted playsInline
               style={{
                 width: '100%', height: '100%', objectFit: 'cover',
                 position: 'absolute', top: 0, left: 0, zIndex: 0
               }}
             >
               <source src={slide.url} type="video/mp4" />
             </video>
          ) : (
            <Box
              sx={{
                width: '100%', height: '100%',
                backgroundImage: `url(${slide.url})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                transform: index === current ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 10s ease-out',
                position: 'absolute', top: 0, left: 0, zIndex: 0
              }}
            />
          )}

          {/* LAYER 2: OVERLAY */}
          {/* Dynamic gradient based on alignment to ensure text contrast */}
          <Box sx={{ 
            position: 'absolute', inset: 0, zIndex: 1, 
            background: slide.align === 'center' 
              ? 'rgba(0,10,20,0.4)' // Uniform dark for center
              : slide.align === 'right'
                ? 'linear-gradient(to left, rgba(0,20,40,0.95) 0%, rgba(0,20,40,0.3) 60%, rgba(0,0,0,0) 100%)' // Dark on right
                : 'linear-gradient(to right, rgba(0,20,40,0.95) 0%, rgba(0,20,40,0.3) 60%, rgba(0,0,0,0) 100%)' // Dark on left (default)
          }} />

          {/* LAYER 3: TEXT CONTENT */}
          <Container maxWidth="xl" sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: slide.align === 'center' ? 'center' : (slide.align === 'right' ? 'flex-end' : 'flex-start'), position: 'relative', zIndex: 2 }}>
            <Box 
              sx={{ 
                maxWidth: '800px', 
                color: 'white', 
                pl: slide.align === 'right' ? 0 : { xs: 2, md: 8 },
                pr: slide.align === 'left' ? 0 : { xs: 2, md: 8 },
                textAlign: slide.align, // Aligns text inside the box
              }}
            >
              {/* CONTENT STACK */}
              <Stack 
                direction={slide.align === 'center' ? 'column' : (slide.align === 'right' ? 'row-reverse' : 'row')} 
                spacing={{ xs: 2, md: 3 }} 
                alignItems="center"
                justifyContent={slide.align === 'center' ? 'center' : 'flex-start'}
              >
                {/* Icon Box with Glassmorphism */}
                <Box sx={{ 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(10px)',
                    display: { xs: 'none', md: 'flex' },
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}>
                  {slide.icon}
                </Box>

                <Box>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontWeight: 800, 
                      fontSize: { xs: '2.5rem', md: '4.5rem' }, 
                      mb: 2, lineHeight: 1.1,
                      textShadow: '0 4px 20px rgba(0,0,0,0.5)' 
                    }}
                  >
                    {/* Split title to apply gradient to specific words if needed, or apply to all */}
                    <span className={index === 1 ? "gradient-text" : ""}>
                      {slide.title}
                    </span>
                  </Typography>

                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 500, mb: 4, 
                      maxWidth: '600px', 
                      mx: slide.align === 'center' ? 'auto' : 0, // Centers text block if mode is center
                      lineHeight: 1.6, 
                      color: '#E0E0E0',
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                    }}
                  >
                    {slide.subtitle}
                  </Typography>
                  
                  <Button 
                    variant="contained" size="large" 
                    sx={{ 
                      bgcolor: index === 1 ? '#00ffaa' : '#00E5FF', // Vary button color slightly
                      color: '#0A2540', 
                      fontWeight: '800', 
                      fontSize: '1rem', 
                      py: 1.8, px: 5, 
                      borderRadius: '50px', 
                      boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
                      '&:hover': { bgcolor: 'white', transform: 'translateY(-2px)' }, 
                      transition: 'all 0.3s'
                    }}
                  >
                    Get Started
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Container>
        </Box>
      ))}

      {/* CONTROLS */}
      <Stack 
        direction="row" spacing={1.5} 
        sx={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}
      >
        {slides.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrent(index)}
            sx={{
              width: current === index ? 40 : 12,
              height: 12,
              borderRadius: '12px',
              bgcolor: current === index ? '#00E5FF' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: current === index ? '0 0 15px #00E5FF' : 'none',
              '&:hover': { bgcolor: '#00E5FF' }
            }}
          />
        ))}
      </Stack>
      
      <IconButton 
        onClick={prevSlide}
        sx={{ 
          position: 'absolute', left: { xs: 10, md: 40 }, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
          bgcolor: 'rgba(0,0,0,0.3)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
          width: 50, height: 50,
          '&:hover': { bgcolor: '#00E5FF', color: '#000', borderColor: '#00E5FF' }, display: { xs: 'none', md: 'inline-flex' }
        }}
      >
        <NavigateBeforeIcon />
      </IconButton>
      <IconButton 
        onClick={nextSlide}
        sx={{ 
          position: 'absolute', right: { xs: 10, md: 40 }, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
          bgcolor: 'rgba(0,0,0,0.3)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
          width: 50, height: 50,
          '&:hover': { bgcolor: '#00E5FF', color: '#000', borderColor: '#00E5FF' }, display: { xs: 'none', md: 'inline-flex' }
        }}
      >
        <NavigateNextIcon />
      </IconButton>
    </Box>
  );
};

// --- PHONE MOCKUP COMPONENT ---
const PhoneScanner = () => {
  return (
    <Box sx={{ 
      width: '300px', height: '600px', bgcolor: '#121212', borderRadius: '45px', border: '8px solid #2d2d2d',
      position: 'relative', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)',
    }}>
      <Box sx={{ position: 'absolute', top: 100, left: -11, width: 4, height: 40, bgcolor: '#2d2d2d', borderRadius: '4px 0 0 4px' }} />
      <Box sx={{ position: 'absolute', top: 150, left: -11, width: 4, height: 40, bgcolor: '#2d2d2d', borderRadius: '4px 0 0 4px' }} />
      <Box sx={{ position: 'absolute', top: 120, right: -11, width: 4, height: 70, bgcolor: '#2d2d2d', borderRadius: '0 4px 4px 0' }} />

      <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '38px', bgcolor: 'black' }}>
        <Box sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: '100px', height: '24px', bgcolor: 'black', borderRadius: '20px', zIndex: 20 }} />
        <Box sx={{ width: '100%', height: '100%', backgroundImage: 'url("https://images.unsplash.com/photo-1551060933-281b37494443?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
           <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)' }}>
              <Box sx={{ position: 'absolute', top: '22%', left: '10%', right: '10%', height: '35%', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '24px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                <Box sx={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', bgcolor: '#00E5FF', color: '#000', px: 2, py: 0.5, borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>SCANNING...</Box>
                <Box sx={{ width: '100%', height: '2px', bgcolor: '#00E5FF', boxShadow: '0 0 15px #00E5FF', animation: 'scan 2s infinite linear' }} />
              </Box>
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '35px 35px 0 0', p: 3 }}>
                 <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip label="Male" sx={{ bgcolor: '#E1F5FE', color: '#0288D1', fontWeight: 'bold' }} size="small" />
                    <Chip label="Healthy" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 'bold' }} size="small" />
                 </Stack>
                 <Typography variant="h5" fontWeight="800" color="#0A2540">Aust. Red Claw</Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Confidence: <strong>98.4%</strong></Typography>
                 <Button variant="contained" fullWidth size="large" sx={{ bgcolor: '#008080', color: 'white', borderRadius: '16px', py: 1.5, fontWeight: 'bold' }}>Save Record</Button>
              </Box>
           </Box>
        </Box>
      </Box>
    </Box>
  );
};

// --- MAIN PAGE COMPONENT ---
const LandingPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF', overflowX: 'hidden' }}>
      <FontStyles />
      <Navbar />
      <HeroSlideshow />

      <Box sx={{ py: 12, bgcolor: '#FAFAFA' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
          <Grid container spacing={8} alignItems="center" justifyContent="center">
            
            {/* LEFT COLUMN: Features */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 5 }}>
                <Typography variant="overline" sx={{ color: '#008080', fontWeight: 800, letterSpacing: 2, fontSize: '0.9rem' }}>
                  SYSTEM CAPABILITIES
                </Typography>
                <Typography variant="h2" sx={{ color: '#0A2540', fontWeight: 800, mt: 1, mb: 2, letterSpacing: '-1px' }}>
                  Everything you need to <br/> scale your farm.
                </Typography>
                <Typography variant="body1" sx={{ color: '#556987', fontSize: '1.1rem', lineHeight: 1.6 }}>
                   Our system replaces expensive lab equipment with the camera you already own.
                </Typography>
              </Box>

              <Grid container spacing={2} direction="column"> 
                 {[
                   { icon: <CameraAltIcon sx={{ fontSize: 24, color: 'white' }} />, color: '#008080', title: "Visual Analysis", desc: "Validate species (ARC), identify gender (M/F), and detect berried females." },
                   { icon: <WaterDropIcon sx={{ fontSize: 24, color: 'white' }} />, color: '#0288D1', title: "Water Health", desc: "Monitor turbidity levels and detect algae blooms from a single photo." },
                   { icon: <AnalyticsIcon sx={{ fontSize: 24, color: 'white' }} />, color: '#7B1FA2', title: "Profitability", desc: "Forecast revenue based on current growth rates and market prices." },
                   { icon: <SecurityIcon sx={{ fontSize: 24, color: 'white' }} />, color: '#2E7D32', title: "Secure Platform", desc: "Enterprise-grade authentication with moderated community feeds." }
                 ].map((feature, i) => (
                   <Grid item xs={12} key={i}>
                      <Card elevation={0} sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'white', border: '1px solid #EEF0F2', borderRadius: '20px', transition: '0.3s', '&:hover': { transform: 'translateX(10px)', borderColor: feature.color, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' } }}>
                          <Box sx={{ minWidth: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', bgcolor: feature.color, mr: 3 }}>
                            {feature.icon}
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" color="#0A2540" fontSize="1.1rem">{feature.title}</Typography>
                            <Typography variant="body2" color="#556987">{feature.desc}</Typography>
                          </Box>
                      </Card>
                   </Grid>
                 ))}
              </Grid>
            </Grid>

            {/* RIGHT COLUMN: Phone Mockup */}
            <Grid 
                item 
                xs={12} 
                md={6} 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: { xs: 5, md: 0 }
                }}
            >
               <Box sx={{ position: 'relative' }}> 
                  <Box sx={{ position: 'absolute', top: '15%', right: '-20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,229,255,0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 }} />
                  <Box sx={{ position: 'relative', zIndex: 1, animation: 'float 6s ease-in-out infinite' }}>
                    <PhoneScanner />
                  </Box>
               </Box>
            </Grid>

          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
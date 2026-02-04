import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import ScaleIcon from '@mui/icons-material/Scale';

// --- FONT STYLES ---
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap');
      body, h1, h2, h3, h4, h5, h6, p, span, div, button {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
    `}
  </style>
);

const TheRedClaw = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F9FC', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <FontStyles />
      <Navbar />

      {/* --- 1. THIN HEADER --- */}
      <Box sx={{ py: 3, bgcolor: 'white', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Typography variant="overline" sx={{ color: '#008080', fontWeight: 800, letterSpacing: 3 }}>
          SPECIES PROFILE
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0A2540', letterSpacing: '-1px' }}>
          The Australian Red Claw
        </Typography>
      </Box>

      {/* --- 2. FULL WIDTH FLEX LAYOUT --- */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        width: '100%', 
        height: { xs: 'auto', md: '85vh' }, 
        p: 2, 
        gap: 2 
      }}>
        
        {/* --- LEFT COLUMN: VIDEO (75% WIDTH) --- */}
        <Box sx={{ 
          flex: 3, 
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          bgcolor: 'black',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          minHeight: '400px' 
        }}>
          <video
            autoPlay loop muted playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.95
            }}
          >
            {/* UPDATED SOURCE LINK HERE */}
            <source 
              src="https://www.shutterstock.com/shutterstock/videos/3438134305/preview/stock-footage-growing-of-crayfish-australian-blue-crayfish-cherax-quadricarinatus-in-aquarium.webm" 
              type="video/webm" 
            />
          </video>
          
          {/* Bottom Gradient */}
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />
          
          {/* Live Label */}
          <Box sx={{ position: 'absolute', top: 30, left: 30, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: '#FF5252', borderRadius: '50%', boxShadow: '0 0 10px #FF5252' }} />
              <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5, borderRadius: '4px' }}>
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, letterSpacing: 1, fontSize: '0.75rem' }}>
                  LIVE FEED
                </Typography>
              </Box>
          </Box>
        </Box>

        {/* --- RIGHT COLUMN: TRIVIA CARDS (25% WIDTH) --- */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100%' 
        }}>
          
          {/* CARD 1 */}
          <Paper elevation={0} sx={{ 
            flex: 1, 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: 'white', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: '0.2s', '&:hover': { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ p: 1, bgcolor: '#FFEBEE', borderRadius: '12px', color: '#FF5252' }}>
                <LocalOfferIcon />
              </Box>
              <Typography variant="h6" fontWeight="800" color="#0A2540">The Name</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#556987', lineHeight: 1.5 }}>
                Named for the <strong>red patch</strong> on adult male claws. Females do not develop this patch!
            </Typography>
          </Paper>

          {/* CARD 2 */}
          <Paper elevation={0} sx={{ 
            flex: 1, 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: 'white', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: '0.2s', '&:hover': { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 1, bgcolor: '#E0F2F1', borderRadius: '12px', color: '#008080' }}>
                <ThermostatIcon />
              </Box>
              <Typography variant="h6" fontWeight="800" color="#0A2540">Climate</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#556987', lineHeight: 1.5 }}>
              Thrives in <strong>23°C - 31°C</strong>. Requires high dissolved oxygen for maximum growth.
            </Typography>
          </Paper>

          {/* CARD 3 */}
          <Paper elevation={0} sx={{ 
            flex: 1, 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: 'white', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: '0.2s', '&:hover': { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 1, bgcolor: '#E3F2FD', borderRadius: '12px', color: '#00E5FF' }}>
                <ScaleIcon />
              </Box>
              <Typography variant="h6" fontWeight="800" color="#0A2540">Size</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#556987', lineHeight: 1.5 }}>
              Can grow over <strong>600g</strong> (1.3 lbs). Boasts a 30% meat yield.
            </Typography>
          </Paper>

        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default TheRedClaw;
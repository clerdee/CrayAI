import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation(); 
  const navigate = useNavigate();

  // --- AUTH STATE ---
  // Check if user is logged in based on your App.jsx logic
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Read user from local storage to check session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]); // Re-check on route change (e.g. after login)

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // --- MENU ITEMS ---
  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },      
    { label: 'The Red Claw', path: '/red-claw' }, 
  ];

  // --- USER DROPDOWN (For logged in users) ---
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={0} 
      sx={{ 
        py: 1, 
        bgcolor: 'rgba(255,255,255,0.90)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
        zIndex: 1100
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          
          {/* --- LOGO SECTION --- */}
          <Box 
            component={Link} 
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              flexGrow: { xs: 1, md: 0 }, 
              mr: 5, 
              cursor: 'pointer',
              textDecoration: 'none' 
            }}
          >
            <img 
              src="/crayfish.png" 
              alt="CrayAI Logo" 
              style={{ height: '42px', width: 'auto' }} 
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: '#0A2540', 
                fontWeight: 800, 
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '1.5rem',
                letterSpacing: '-0.5px'
              }}
            >
              CrayAI
            </Typography>
          </Box>

          {/* --- DESKTOP MENU LINKS --- */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 4 }}>
              {menuItems.map((item) => (
                <Button 
                  key={item.label}
                  component={Link}
                  to={item.path}
                  sx={{ 
                    color: location.pathname === item.path ? '#008080' : '#556987', 
                    fontWeight: 600, 
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    textTransform: 'none',
                    fontSize: '1rem',
                    position: 'relative',
                    '&:hover': { 
                      color: '#008080', 
                      bgcolor: 'transparent' 
                    },
                    '&::after': location.pathname === item.path ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 5,
                      left: 10,
                      right: 10,
                      height: '2px',
                      bgcolor: '#008080',
                      borderRadius: '2px'
                    } : {}
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* --- AUTH BUTTONS OR USER MENU --- */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            
            {user ? (
              // SCENARIO 1: USER IS LOGGED IN -> Show Avatar & Dropdown
              <>
                <Button 
                   onClick={handleMenuClick}
                   sx={{ 
                     textTransform: 'none', 
                     color: '#0A2540',
                     fontWeight: 600,
                     fontFamily: '"Plus Jakarta Sans", sans-serif',
                     gap: 1
                   }}
                >
                  <Avatar 
                    sx={{ width: 32, height: 32, bgcolor: '#008080', fontSize: '0.9rem' }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  {!isMobile && user.name}
                </Button>

                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                      mt: 1.5,
                      borderRadius: '12px',
                      minWidth: 180
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem 
                    component={Link} 
                    to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                  >
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              // SCENARIO 2: GUEST -> Show Login / Register
              <>
                <Button 
                  component={Link}
                  to="/login"  // Updated to match App.jsx
                  sx={{ 
                    color: '#0A2540', 
                    fontWeight: 700, 
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  Login
                </Button>
                
                <Button 
                  component={Link}
                  to="/register" // Updated to match App.jsx
                  variant="contained" 
                  sx={{ 
                    bgcolor: '#008080',
                    color: 'white',
                    fontWeight: 700,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    textTransform: 'none',
                    borderRadius: '50px',
                    px: 3,
                    py: 1,
                    boxShadow: '0 4px 14px 0 rgba(0,128,128,0.39)',
                    '&:hover': { 
                      bgcolor: '#006666', 
                      boxShadow: '0 6px 20px rgba(0,128,128,0.23)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Join Us!
                </Button>
              </>
            )}
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
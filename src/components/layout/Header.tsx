"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
} from "@mui/material";
import {
  Map as MapIcon,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    router.push("/");
    router.refresh();
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MapIcon color="primary" />
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              PlanIt
            </Typography>
          </Box>
        </Link>

        {/* Navigation */}
        <Box sx={{ display: "flex", gap: 1, ml: 4, flexGrow: 1 }}>
          <Button
            component={Link}
            href="/"
            color="inherit"
            startIcon={<MapIcon />}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            Explore
          </Button>
          <Button
            component={Link}
            href="/search"
            color="inherit"
            startIcon={<SearchIcon />}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            Search
          </Button>
          {user && (
            <>
              <Button
                component={Link}
                href="/calendar"
                color="inherit"
                startIcon={<CalendarIcon />}
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                My Events
              </Button>
              <Button
                component={Link}
                href="/events/new"
                color="primary"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                Create Event
              </Button>
            </>
          )}
        </Box>

        {/* Auth Buttons */}
        {!loading && (
          <>
            {user ? (
              <>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getInitials(user.email || "U")}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={handleMenuClose}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/calendar"
                    onClick={handleMenuClose}
                  >
                    My Events
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/events/new"
                    onClick={handleMenuClose}
                  >
                    Create Event
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/entities/new"
                    onClick={handleMenuClose}
                  >
                    Create Organization
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/settings"
                    onClick={handleMenuClose}
                  >
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button component={Link} href="/login" color="inherit">
                  Log In
                </Button>
                <Button
                  component={Link}
                  href="/signup"
                  variant="contained"
                  color="primary"
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
